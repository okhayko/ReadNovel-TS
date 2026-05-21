import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Square, Gauge } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { ReaderSettings } from '../types';
import { Meteors } from "./Meteors";

interface TTSPlayerProps {
    content: string;
    onIndexChange: (index: number) => void;
    currentIndex: number;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    onEndChapter?: () => void;
    settings: ReaderSettings;
}

const VOICES = [
    { value: 'vi-VN-HoaiMyNeural', label: 'Hoài My (Nữ)', type: 'edge' },
    { value: 'vi-VN-NamMinhNeural', label: 'Nam Minh (Nam)', type: 'edge' },
    { value: 'ngochuyennew', label: 'Ngọc Huyền (Nữ - NghiTTS)', type: 'nghi' }
];

const TTSPlayerMobile: React.FC<TTSPlayerProps> = ({ content, onIndexChange, currentIndex, isPlaying, setIsPlaying, isPaused, setIsPaused, onEndChapter, settings }) => {
    const [voice, setVoice] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('tts-voice')) || 'vi-VN-HoaiMyNeural');
    const [rate, setRate] = useState(() => (typeof window !== 'undefined' && parseFloat(localStorage.getItem('tts-rate') || '1.0')) || 1.0);
    const [volume, setVolume] = useState(() => (typeof window !== 'undefined' && parseFloat(localStorage.getItem('tts-volume') || '1.0')) || 1.0);
    const [loadProgress, setLoadProgress] = useState(0);

    // Persist settings
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('tts-voice', voice);
        }
    }, [voice]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('tts-rate', rate.toString());
        }
    }, [rate]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('tts-volume', volume.toString());
        }
    }, [volume]);

    const getSliderBackground = (value: number, min: number, max: number) => {
        const percentage = ((value - min) / (max - min)) * 100;
        return {
            background: `linear-gradient(to right, rgba(var(--app-accent-rgb), 1) ${percentage}%, rgba(82, 82, 82, 0.322) ${percentage}%)`
        };
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const prefetchCache = useRef<Map<number, string>>(new Map());
    const isFetching = useRef<Map<number, Promise<string | null>>>(new Map());

    // NghiTTS Worker
    const workerRef = useRef<Worker | null>(null);
    const pendingWorkerRequests = useRef<Map<number, { resolve: (url: string | null) => void, reject: (err: any) => void }>>(new Map());
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const isWorkerReadyRef = useRef(false);

    const isModelLoading = VOICES.find(v => v.value === voice)?.type === 'nghi' && !isWorkerReady;

    useEffect(() => {
        const isNghiTTS = VOICES.find(v => v.value === voice)?.type === 'nghi';

        if (isNghiTTS && !workerRef.current) {
            setIsWorkerReady(false);
            isWorkerReadyRef.current = false;
            const worker = new Worker(new URL('../workers/tts-worker.js', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { status, id, audio, data, progress } = e.data;
                if (status === 'progress') {
                    setLoadProgress(progress);
                } else if (status === 'ready') {
                    setIsWorkerReady(true);
                    isWorkerReadyRef.current = true;
                } else if (status === 'complete') {
                    if (id !== undefined && pendingWorkerRequests.current.has(id)) {
                        const { resolve } = pendingWorkerRequests.current.get(id)!;
                        pendingWorkerRequests.current.delete(id);
                        if (audio) {
                            const url = URL.createObjectURL(audio);
                            resolve(url);
                        } else {
                            resolve(null);
                        }
                    }
                } else if (status === 'error') {
                    if (id !== undefined && pendingWorkerRequests.current.has(id)) {
                        const { reject } = pendingWorkerRequests.current.get(id)!;
                        pendingWorkerRequests.current.delete(id);
                        reject(new Error(data));
                    }
                }
            };

            worker.postMessage({ type: 'init', model: voice });
            workerRef.current = worker;
        } else if (!isNghiTTS && workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsWorkerReady(false);
            isWorkerReadyRef.current = false;
            pendingWorkerRequests.current.clear();
        }
    }, [voice]);

    // Parse content into segments
    const textArray = useMemo(() => {
        if (!content) return [];
        return content
            .split(/\n|(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }, [content]);

    const cleanText = (text: string) => {
        return text.replace(/[""“”]/g, '');
    };

    const stopTTS = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        prefetchCache.current.forEach(url => URL.revokeObjectURL(url));
        prefetchCache.current.clear();
        isFetching.current.clear();

        pendingWorkerRequests.current.forEach(({ resolve }) => resolve(null));
        pendingWorkerRequests.current.clear();

        setIsPlaying(false);
        setIsPaused(false);
    };

    const fetchAudio = (index: number, retryCount = 0): Promise<string | null> => {
        if (index >= textArray.length || index < 0) return Promise.resolve(null);
        if (prefetchCache.current.has(index)) return Promise.resolve(prefetchCache.current.get(index)!);

        if (isFetching.current.has(index)) {
            return isFetching.current.get(index)!;
        }

        const fetchPromise = (async () => {
            const text = cleanText(textArray[index]);
            const voiceType = VOICES.find(v => v.value === voice)?.type;

            try {
                if (voiceType === 'nghi') {
                    if (!workerRef.current) throw new Error("Worker not initialized");

                    let waitCount = 0;
                    while (!isWorkerReadyRef.current && waitCount < 60) {
                        await new Promise(r => setTimeout(r, 500));
                        waitCount++;
                    }
                    if (!isWorkerReadyRef.current) throw new Error("Worker not ready (timeout)");

                    const url = await new Promise<string | null>((resolve, reject) => {
                        pendingWorkerRequests.current.set(index, { resolve, reject });
                        workerRef.current?.postMessage({
                            type: 'generate', id: index, text, voice: 0, speed: rate
                        });
                    });

                    if (url) prefetchCache.current.set(index, url);
                    return url;
                } else {
                    const response = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voice, rate }),
                    });

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    if (blob.size === 0) throw new Error("Empty audio");

                    const url = URL.createObjectURL(blob);
                    prefetchCache.current.set(index, url);
                    return url;
                }
            } catch (err) {
                console.error(`Error fetching audio for index ${index}:`, err);
                if (retryCount < 2) {
                    await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
                    isFetching.current.delete(index);
                    return fetchAudio(index, retryCount + 1);
                }
                return null;
            } finally {
                isFetching.current.delete(index);
            }
        })();

        isFetching.current.set(index, fetchPromise);
        return fetchPromise;
    };

    const speak = async (index: number) => {
        if (index >= textArray.length) {
            if (onEndChapter) {
                onEndChapter();
            } else {
                stopTTS();
            }
            return;
        }

        let url = prefetchCache.current.get(index);
        if (!url) url = await fetchAudio(index) || undefined;
        if (!url) {
            stopTTS();
            return;
        }

        if (audioRef.current) {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            audioRef.current.pause();
            audioRef.current.src = url;
        } else {
            audioRef.current = new Audio(url);
        }

        audioRef.current.playbackRate = rate;
        audioRef.current.volume = volume;

        let nextTriggered = false;
        const handleNextTrigger = () => {
            if (!nextTriggered && isPlaying && !isPaused) {
                nextTriggered = true;
                onIndexChange(index + 1);
            }
        };

        audioRef.current.onended = handleNextTrigger;

        // High precision early trigger using requestAnimationFrame
        const checkTime = () => {
            if (audioRef.current && audioRef.current.duration > 0) {
                const timeLeft = (audioRef.current.duration - audioRef.current.currentTime) / audioRef.current.playbackRate;
                const earlyTriggerTime = VOICES.find(v => v.value === voice)?.type === 'nghi' ? 0.05 : 0.45;
                if (timeLeft < earlyTriggerTime) { // Seamless transition
                    handleNextTrigger();
                } else {
                    rafIdRef.current = requestAnimationFrame(checkTime);
                }
            } else {
                rafIdRef.current = requestAnimationFrame(checkTime);
            }
        };
        rafIdRef.current = requestAnimationFrame(checkTime);

        try {
            await audioRef.current.play();

            // Luôn fetch tiếp 2 câu tiếp theo cho CẢ 2 hệ thống để đảm bảo mượt mà
            fetchAudio(index + 1);
            fetchAudio(index + 2);

            if (prefetchCache.current.size > 5) {
                for (const [key, cachedUrl] of prefetchCache.current.entries()) {
                    if (key < index - 1 || key > index + 3) {
                        URL.revokeObjectURL(cachedUrl);
                        prefetchCache.current.delete(key);
                    }
                }
            }
        } catch (err) {
            console.error("Audio play error:", err);
            stopTTS();
        }
    };

    useEffect(() => {
        if (isPlaying && !isPaused) {
            speak(currentIndex);
        } else if (isPaused && audioRef.current) {
            audioRef.current.pause();
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        }
        return () => {
            if (audioRef.current) audioRef.current.pause();
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [currentIndex, isPlaying, isPaused, voice, rate]);

    // Independent Volume Control
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handleTogglePlay = async () => {
        if (isModelLoading) return;

        if (isPlaying) {
            if (isPaused) {
                setIsPaused(false);
                if (audioRef.current) audioRef.current.play();
            } else {
                setIsPaused(true);
                if (audioRef.current) audioRef.current.pause();
            }
        } else {
            setIsPlaying(true);
            setIsPaused(false);
        }
    };

    const handleNext = () => currentIndex < textArray.length - 1 && onIndexChange(currentIndex + 1);
    const handlePrev = () => currentIndex > 0 && onIndexChange(currentIndex - 1);

    return (
        <div className="flex flex-col gap-4 p-4 bg-app-surface/50 backdrop-blur-md border border-app-border rounded-2xl mb-8 relative">
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <Meteors number={10} />
            </div>
            <div className="flex items-center justify-between w-full gap-4 relative z-10">
                {/* Voice Selection - Left */}
                <div className="flex-1">
                    <CustomDropdown
                        options={VOICES}
                        value={voice}
                        onChange={setVoice}
                        placeholder="Chọn giọng đọc"
                        className="w-full"
                        buttonClassName="bg-app-bg/50 border-app-border text-xs py-2"
                        centered={false}
                    />
                    {isModelLoading && (
                        <div className="text-[10px] text-app-accent animate-pulse mt-2 flex flex-col items-center w-full">
                            <div className="flex items-center gap-1.5 mb-1 w-full">
                                <div className="w-3 h-3 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
                                <span>Đang khởi tạo mô hình... {loadProgress}%</span>
                            </div>
                            <div className="w-full bg-app-surface h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-app-accent transition-all duration-300" style={{ width: `${loadProgress}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls - Right */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrev}
                        className="p-2 rounded-full hover:bg-white/10 text-app-textMuted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={currentIndex === 0 || isModelLoading}
                    >
                        <SkipBack size={18} />
                    </button>

                    <button
                        onClick={handleTogglePlay}
                        disabled={isModelLoading}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-lg ${isModelLoading ? 'bg-app-surface/50 text-app-textMuted cursor-wait' : 'bg-app-accent text-app-bg hover:scale-105 shadow-app-accent/20'
                            }`}
                    >
                        {isModelLoading ? (
                            <div className="w-5 h-5 border-2 border-app-textMuted border-t-transparent rounded-full animate-spin" />
                        ) : (
                            isPlaying && !isPaused ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />
                        )}
                    </button>

                    <button
                        onClick={handleNext}
                        className="p-2 rounded-full hover:bg-white/10 text-app-textMuted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={currentIndex >= textArray.length - 1 || isModelLoading}
                    >
                        <SkipForward size={18} />
                    </button>

                    <button
                        onClick={() => { stopTTS(); onIndexChange(0); }}
                        className="p-2 rounded-full hover:bg-white/10 text-app-textMuted transition-colors"
                    >
                        <Square size={16} fill="currentColor" />
                    </button>
                </div>
            </div>

            {/* Controls and Speed */}
            <div className="flex items-center justify-between mt-4">
                {/* Speed and Volume Controls */}
                <div className="flex-1 flex flex-col gap-3 mr-4">
                    {/* Volume Control */}
                    <div className="flex items-center gap-3">
                        <svg
                            className="w-[18px] h-[18px] text-app-textMuted shrink-0 transition-all duration-300 group-hover:text-app-accent"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            xmlSpace="preserve"
                        >
                            <g>
                                <path
                                    d="M18.36 19.36a1 1 0 0 1-.705-1.71C19.167 16.148 20 14.142 20 12s-.833-4.148-2.345-5.65a1 1 0 1 1 1.41-1.419C20.958 6.812 22 9.322 22 12s-1.042 5.188-2.935 7.069a.997.997 0 0 1-.705.291z"
                                    fill="currentColor"
                                ></path>
                                <path
                                    d="M15.53 16.53a.999.999 0 0 1-.703-1.711C15.572 14.082 16 13.054 16 12s-.428-2.082-1.173-2.819a1 1 0 1 1 1.406-1.422A6 6 0 0 1 18 12a6 6 0 0 1-1.767 4.241.996.996 0 0 1-.703.289zM12 22a1 1 0 0 1-.707-.293L6.586 17H4c-1.103 0-2-.897-2-2V9c0-1.103.897-2 2-2h2.586l4.707-4.707A.998.998 0 0 1 13 3v18a1 1 0 0 1-1 1z"
                                    fill="currentColor"
                                ></path>
                            </g>
                        </svg>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="custom-slider"
                        />
                        <span className="text-[10px] font-mono text-app-textMuted w-8 text-right">{Math.round(volume * 100)}%</span>
                    </div>

                    {/* Speed Control */}
                    <div className="flex items-center gap-3">
                        <Gauge size={18} className="text-app-textMuted shrink-0" />
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={rate}
                            onChange={(e) => setRate(parseFloat(e.target.value))}
                            className="slider-with-thumb"
                            style={getSliderBackground(rate, 0.5, 2.0)}
                        />
                        <span className="text-[10px] font-mono text-app-textMuted w-8 text-right">{rate.toFixed(2)}x</span>
                    </div>
                </div>
            </div>

            {isPlaying && (
                <div className="text-[9px] text-app-accent/70 font-medium uppercase tracking-widest animate-pulse text-center w-full flex flex-col items-center">
                    <span>Đang đọc câu {currentIndex + 1} / {textArray.length}</span>
                </div>
            )}
        </div>
    );
};

export default TTSPlayerMobile;
