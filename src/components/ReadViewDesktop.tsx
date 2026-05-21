import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReadState, CustomFont } from '../types';
import DialogueLine from './DialogueLine';
import GooeyNav from './GooeyNav';
import CustomDropdown from './CustomDropdown';
import { 
    SettingsIcon, 
    LineHeightIcon, 
    ParagraphSpacingIcon, 
    FontSizeIcon, 
    FontIcon, 
    HeadingFontIcon,
    UploadIcon,
    WidthIcon, 
    ChatBubbleIcon, 
    ArrowUpIcon, 
    ArrowDownIcon,
    PaletteIcon,
    PauseIcon,
    PlayIcon
} from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import SettingControl from './SettingControl';
import ChapterNavigation from './ChapterNavigation';
import ColorPicker from './ColorPicker';
import { InteractiveHoverButton } from './InteractiveHoverButton';
import TTSPlayerDesktop from './TTSPlayerDesktop';
import FloatingPlayPauseButton from './FloatingPlayPauseButton';

interface ReadViewProps {
    readState: ReadState;
    setReadState: React.Dispatch<React.SetStateAction<ReadState>>;
    customFonts: CustomFont[];
    setCustomFonts: React.Dispatch<React.SetStateAction<CustomFont[]>>;
    onBack: () => void;
}

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50];
const LINE_HEIGHTS = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0];
const PARAGRAPH_SPACINGS = [-12, -8, -4, 0, 4, 8, 12, 16, 20, 24, 32, 40, 48];
const FONTS = ['Sora', 'Oswald-Light', 'Oswald-Medium', 'Gelasio-Regular', 'Texturina_48pt-Bold', 'Tahoma', 'Arial', 'Verdana', 'Georgia', 'Times New Roman'];
const CONTAINER_WIDTHS = [700, 800, 910, 1000, 1100];

const ReadViewDesktop: React.FC<ReadViewProps> = ({ readState, setReadState, customFonts, setCustomFonts, onBack }) => {
    const { readerChapters, currentReaderChapterIndex, settings } = readState;
    const { fontSizeIndex, lineHeightIndex, fontFamily, titleFontFamily, paragraphSpacingIndex, backgroundColor } = settings;
    
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentContainerWidth = Math.min(
        settings.containerWidth || CONTAINER_WIDTHS[settings.containerWidthIndex || 2],
        windowWidth - 100
    );
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [ttsIndex, setTtsIndex] = useState(0);
    const [isTTSPlaying, setIsTTSPlaying] = useState(false);
    const [isTTSPaused, setIsTTSPaused] = useState(false);
    const lastScrollY = useRef(0);
    const initialColorRef = useRef(backgroundColor || '#1B1D1E');
    
    const settingsRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSettingsVisible && !isColorPickerVisible &&
                settingsRef.current && 
                !settingsRef.current.contains(event.target as Node) &&
                settingsButtonRef.current &&
                !settingsButtonRef.current.contains(event.target as Node)) {
                setIsSettingsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSettingsVisible, isColorPickerVisible]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                // Scrolling down
                setIsHeaderVisible(false);
                setIsSettingsVisible(false); // Close settings when scrolling down
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling up
                setIsHeaderVisible(true);
            }
            
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field (just in case)
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                if (currentReaderChapterIndex > 0) {
                    handleChapterChange(currentReaderChapterIndex - 1);
                }
            } else if (e.key === 'ArrowRight') {
                if (currentReaderChapterIndex < readerChapters.length - 1) {
                    handleChapterChange(currentReaderChapterIndex + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentReaderChapterIndex, readerChapters.length]);

    const handleChapterChange = (index: number) => {
        setReadState(prev => ({ ...prev, currentReaderChapterIndex: index }));
        window.scrollTo(0, 0);
    };

    const handleNextChapterAuto = () => {
        if (currentReaderChapterIndex < readerChapters.length - 1) {
            setReadState(prev => ({ ...prev, currentReaderChapterIndex: currentReaderChapterIndex + 1 }));
            setTtsIndex(0);
            setIsTTSPlaying(true);
            setIsTTSPaused(false);
            window.scrollTo(0, 0);
        } else {
            setIsTTSPlaying(false);
        }
    };

    const handleWidthDecrement = () => {
        setReadState(p => {
            const current = p.settings.containerWidth || CONTAINER_WIDTHS[p.settings.containerWidthIndex || 2];
            return {...p, settings: {...p.settings, containerWidth: Math.max(400, current - 100)}};
        });
    };

    const handleWidthIncrement = () => {
        setReadState(p => {
            const current = p.settings.containerWidth || CONTAINER_WIDTHS[p.settings.containerWidthIndex || 2];
            const maxWidth = windowWidth - 100;
            return {...p, settings: {...p.settings, containerWidth: Math.min(maxWidth, current + 100)}};
        });
    };

    const openColorPicker = () => {
        initialColorRef.current = settings.backgroundColor || '#1B1D1E';
        setIsColorPickerVisible(true);
    };

    const closeColorPicker = () => {
        // Revert to initial color if cancelled
        setReadState(p => ({...p, settings: {...p.settings, backgroundColor: initialColorRef.current}}));
        setIsColorPickerVisible(false);
    };

    const confirmColorPicker = (color: string) => {
        setReadState(p => {
            const currentRecents = p.settings.recentColors || ['#F4ECD8', '#E3EDCD', '#E8E9EA', '#1B1D1E', '#000000', '#FFFFFF'];
            let newRecents = currentRecents;
            // Only update recent colors if it's not already the first one
            if (currentRecents[0] !== color) {
                newRecents = [color, ...currentRecents.filter(c => c !== color)].slice(0, 6);
            }
            return {
                ...p, 
                settings: {
                    ...p.settings, 
                    backgroundColor: color,
                    recentColors: newRecents
                }
            };
        });
        setIsColorPickerVisible(false);
    };

    const currentChapter = readerChapters[currentReaderChapterIndex];

    // Helper to split content into segments for TTS and highlighting
    const segments = useMemo(() => {
        if (!currentChapter?.content) return [];
        return currentChapter.content
            .split(/\n|(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }, [currentChapter?.content]);

    // Auto-scroll to current TTS segment
    useEffect(() => {
        if (isTTSPlaying) {
            const activeElement = document.querySelector(`[data-tts-index="${ttsIndex}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [ttsIndex, isTTSPlaying]);

    // Reset TTS when chapter changes manually (not auto)
    useEffect(() => {
        setTtsIndex(0);
        setIsTTSPlaying(false);
        setIsTTSPaused(false);
    }, [currentReaderChapterIndex]);

    return (
        <div className="relative min-h-screen text-app-text" style={{ backgroundColor: backgroundColor || '#1B1D1E' }}>
            <header 
                className={`fixed top-0 left-0 right-0 p-4 z-20 flex justify-between items-center backdrop-blur-lg border-b transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}
                style={{ 
                    backgroundColor: `${backgroundColor || '#1B1D1E'}99`,
                    borderColor: backgroundColor || '#1B1D1E'
                }}
            >
                <div className="flex space-x-2 flex-1">
                    <InteractiveHoverButton 
                        onClick={onBack}
                        className="text-sm"
                    >
                        Thư viện
                    </InteractiveHoverButton>
                </div>
                {currentChapter && (
                    <div className="flex-1 text-center truncate px-4">
                        <span className="text-white font-medium truncate" style={{ fontFamily: titleFontFamily || 'Texturina_48pt-Bold' }}>
                            {currentChapter.title}
                        </span>
                    </div>
                )}
                <div className="flex space-x-2 flex-1 justify-end" ref={settingsButtonRef}>
                    <GooeyNav 
                        initialActiveIndex={-1}
                        shape="square"
                        itemClassName="w-10 h-10 flex items-center justify-center p-0 border border-white/10 bg-[#2A2D2F] hover:border-white/20"
                        items={[
                            { 
                                label: <SettingsIcon />, 
                                onClick: () => setIsSettingsVisible(prev => !prev) 
                            }
                        ]} 
                    />
                </div>
            </header>
            
            <div className="pt-24 pb-8 px-8">
                {currentChapter && (
                    <>
                        <div className="max-w-3xl mx-auto mb-8">
                            <ChapterNavigation 
                                chapters={readerChapters} 
                                currentIndex={currentReaderChapterIndex} 
                                onChapterChange={handleChapterChange} 
                                dropdownDirection="down"
                            />
                        </div>
                        
                        {/* Independent TTS Player Area */}
                        <div className="max-w-3xl mx-auto mb-8 sticky top-[88px] z-10">
                            <TTSPlayerDesktop 
                                content={currentChapter.content}
                                currentIndex={ttsIndex}
                                onIndexChange={setTtsIndex}
                                isPlaying={isTTSPlaying}
                                setIsPlaying={setIsTTSPlaying}
                                isPaused={isTTSPaused}
                                setIsPaused={setIsTTSPaused}
                                onEndChapter={handleNextChapterAuto}
                                settings={settings}
                            />
                        </div>
                    </>
                )}
                <div className="flex justify-center py-8">
                    <div className="transition-all duration-300" style={{ maxWidth: `${currentContainerWidth}px`, width: '100%' }}>
                        {currentChapter ? (
                            <article style={{ fontSize: `${FONT_SIZES[fontSizeIndex]}px`, lineHeight: LINE_HEIGHTS[lineHeightIndex], fontFamily: fontFamily }} className="text-[#D7D5D1]">
                                <div className="mb-12">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-app-textMuted uppercase tracking-[0.2em] mb-4">
                                        <span>{readState.storyName || 'The Silent Echoes'}</span>
                                    </div>
                                    <h1 
                                        style={{ fontFamily: titleFontFamily || 'Playfair Display' }} 
                                        className="text-[64px] leading-[1.1] font-bold text-white mb-6"
                                    >
                                        {currentChapter.title}
                                    </h1>
                                    <div className="w-16 h-1 bg-app-accent/60 rounded-full"></div>
                                </div>

                                {(() => {
                                    let openCount = 0;
                                    
                                    const parasData = currentChapter.content.split('\n').map((paragraph, pIdx) => {
                                        const segmentsList = paragraph.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
                                        const opens = (paragraph.match(/【/g) || []).length;
                                        const closes = (paragraph.match(/】/g) || []).length;
                                        
                                        const previousOpenCount = openCount;
                                        openCount += opens - closes;
                                        
                                        return {
                                            paragraph,
                                            pIdx,
                                            segmentsList,
                                            previousOpenCount,
                                            currentOpenCount: openCount
                                        };
                                    });

                                    const parasBlocks: any[] = [];
                                    let currentMultiBlock: any = null;

                                    for (const data of parasData) {
                                        const { paragraph, previousOpenCount, currentOpenCount } = data;
                                        const isStandaloneSystem = paragraph.trim().startsWith('【') && paragraph.trim().endsWith('】');
                                        const isSystemBlock = settings.systemFrame && (previousOpenCount > 0 || currentOpenCount > 0 || isStandaloneSystem);
                                        
                                        if (isSystemBlock) {
                                            if (!currentMultiBlock) currentMultiBlock = { type: 'multiline', items: [] };
                                            currentMultiBlock.items.push(data);
                                            if (currentOpenCount === 0) {
                                                parasBlocks.push(currentMultiBlock);
                                                currentMultiBlock = null;
                                            }
                                        } else {
                                            if (currentMultiBlock) {
                                                parasBlocks.push(currentMultiBlock);
                                                currentMultiBlock = null;
                                            }
                                            parasBlocks.push({ type: 'normal', data });
                                        }
                                    }
                                    if (currentMultiBlock) parasBlocks.push(currentMultiBlock);

                                    let segmentGlobalOffset = 0;

                                    const SYSTEM_FRAME_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.0' viewBox='0 0 100 100' width='100' height='100'%3E%3Cpath d='M3.347 3.589c-0.222 0.151 -0.222 0.171 -0.222 3.125 0 2.833 0.01 2.974 0.202 3.165s0.333 0.202 3.034 0.202c2.782 0 3.135 -0.04 3.337 -0.343 0.04 -0.06 0.081 -1.411 0.081 -3.014 0 -2.762 -0.01 -2.903 -0.202 -3.095s-0.333 -0.202 -3.105 -0.202c-2.46 0 -2.933 0.02 -3.125 0.161m87.097 0.071c-0.222 0.232 -0.222 0.302 -0.222 3.085v2.843l0.252 0.242 0.242 0.252h2.853c2.419 0 2.893 -0.02 3.085 -0.161 0.222 -0.151 0.222 -0.161 0.222 -3.165s0 -3.014 -0.222 -3.165c-0.192 -0.141 -0.665 -0.161 -3.105 -0.161h-2.893zM3.296 91.008c-0.151 0.161 -0.171 0.534 -0.171 3.115 0 2.702 0.01 2.933 0.181 3.085 0.161 0.151 0.534 0.171 3.165 0.171 2.752 0 2.984 -0.01 3.135 -0.181 0.151 -0.161 0.171 -0.534 0.171 -3.115 0 -2.702 -0.01 -2.933 -0.181 -3.085 -0.161 -0.151 -0.534 -0.171 -3.165 -0.171 -2.752 0 -2.984 0.01 -3.135 0.181m87.127 0.02c-0.192 0.192 -0.202 0.333 -0.202 3.054 0 2.419 0.02 2.883 0.161 3.075 0.151 0.222 0.171 0.222 3.165 0.222 2.601 0 3.034 -0.02 3.165 -0.161 0.141 -0.131 0.161 -0.554 0.161 -3.115s-0.02 -2.984 -0.161 -3.115c-0.131 -0.141 -0.565 -0.161 -3.125 -0.161 -2.833 0 -2.974 0.01 -3.165 0.202' fill='%23D4B86A'/%3E%3Cpath d='M17.288 3.629c-0.141 0.151 -0.202 0.454 -0.262 1.19 -0.363 4.657 -3.196 8.911 -7.359 11.058 -1.804 0.927 -3.054 1.3 -4.98 1.482 -0.786 0.071 -1.27 0.161 -1.381 0.262 -0.171 0.141 -0.181 0.534 -0.181 5.514 0 5.161 0.01 5.373 0.192 5.534 0.171 0.161 0.323 0.171 1.24 0.111 0.706 -0.05 1.099 -0.121 1.22 -0.232 0.161 -0.141 0.171 -0.474 0.171 -4.264V20.161l0.222 -0.04c3.286 -0.635 5.716 -1.815 8.226 -4.012 2.49 -2.177 4.506 -5.655 5.222 -8.982l0.161 -0.776h8.256l0.242 -0.252c0.232 -0.222 0.252 -0.313 0.252 -1.26 0 -1.563 0.605 -1.411 -5.726 -1.411 -5.212 0 -5.333 0 -5.514 0.202m54.425 -0.06c-0.171 0.131 -0.192 0.272 -0.192 1.27 0.01 1.653 -0.423 1.512 4.587 1.512h4.113l0.171 0.776c1.058 4.829 4.284 9.063 8.629 11.351 1.381 0.726 3.034 1.29 4.808 1.643l0.222 0.04v8.266l0.232 0.141c0.121 0.081 0.645 0.161 1.22 0.202 0.857 0.06 1.018 0.04 1.179 -0.101 0.181 -0.161 0.192 -0.433 0.192 -5.534 0 -4.98 -0.01 -5.373 -0.171 -5.514 -0.121 -0.101 -0.504 -0.181 -1.089 -0.232 -4.829 -0.373 -9.063 -3.236 -11.25 -7.611 -0.817 -1.643 -1.401 -3.79 -1.401 -5.171 0 -0.504 -0.05 -0.706 -0.212 -0.917l-0.202 -0.262h-5.323c-4.435 0 -5.343 0.02 -5.514 0.141M3.306 72.248c-0.171 0.181 -0.181 0.585 -0.181 5.484 0 2.903 0.04 5.333 0.081 5.393 0.141 0.222 0.524 0.343 1.058 0.343 1.391 0 3.518 0.565 5.101 1.351 4.405 2.188 7.177 6.21 7.681 11.109 0.071 0.706 0.171 1.159 0.272 1.27 0.141 0.171 0.534 0.181 5.514 0.181 5.071 0 5.373 -0.01 5.524 -0.181 0.141 -0.151 0.171 -0.403 0.171 -1.2 0 -1.583 0.444 -1.442 -4.536 -1.472l-4.173 -0.02 -0.091 -0.403c-0.736 -3.448 -2.248 -6.25 -4.677 -8.679 -2.188 -2.177 -4.839 -3.7 -7.742 -4.425l-1.31 -0.323 -0.03 -4.083c-0.02 -3.73 -0.04 -4.093 -0.202 -4.244 -0.121 -0.111 -0.494 -0.181 -1.23 -0.222 -0.968 -0.071 -1.069 -0.06 -1.23 0.121m91.633 -0.101c-0.363 0.03 -0.615 0.101 -0.706 0.202 -0.101 0.131 -0.141 1.048 -0.181 4.244l-0.05 4.083 -1.139 0.282c-6.139 1.512 -10.796 6.2 -12.409 12.49l-0.272 1.058 -4.224 0.05 -4.234 0.05 -0.121 0.353c-0.181 0.534 -0.161 1.925 0.03 2.198l0.151 0.222h5.383c4.667 0 5.403 -0.02 5.534 -0.151 0.151 -0.151 0.202 -0.433 0.323 -1.714 0.131 -1.482 0.817 -3.558 1.643 -5.01 1.724 -3.014 4.667 -5.413 7.923 -6.482 0.948 -0.302 2.379 -0.554 3.226 -0.554 0.393 0 0.696 -0.06 0.837 -0.161l0.222 -0.151v-5.383c0 -4.758 -0.02 -5.393 -0.161 -5.534 -0.161 -0.161 -0.403 -0.171 -1.774 -0.091' fill='%23D4B86A'/%3E%3Cpath d='M31.563 3.609c-0.202 0.151 -0.232 0.323 -0.313 1.532 -0.222 3.216 -0.817 5.877 -1.915 8.619 -2.036 5.101 -5.413 9.415 -9.879 12.621 -4.304 3.085 -9.365 4.859 -14.657 5.131 -1.069 0.06 -1.341 0.111 -1.492 0.262 -0.171 0.171 -0.181 0.857 -0.181 18.679s0.01 18.508 0.181 18.679c0.161 0.161 0.423 0.202 1.694 0.252 10.131 0.444 19.577 7.016 23.881 16.603 1.371 3.044 2.198 6.421 2.329 9.425 0.06 1.431 0.091 1.603 0.302 1.804 0.141 0.141 1.966 0.161 18.498 0.161 18.206 0 18.337 0 18.538 -0.202 0.151 -0.151 0.202 -0.333 0.202 -0.736 0 -0.282 0.05 -1.048 0.101 -1.683 0.938 -10.403 7.913 -19.647 17.792 -23.569 2.752 -1.089 5.444 -1.673 8.478 -1.825 0.958 -0.04 1.482 -0.111 1.593 -0.202 0.151 -0.121 0.161 -1.754 0.161 -18.72V31.865l-0.222 -0.151c-0.151 -0.111 -0.454 -0.161 -0.897 -0.161 -1.593 0 -4.103 -0.373 -6.19 -0.907 -3.528 -0.917 -7.379 -2.883 -10.383 -5.313 -2.117 -1.704 -4.677 -4.597 -6.149 -6.946 -0.998 -1.593 -2.097 -3.881 -2.812 -5.867 -0.746 -2.097 -1.472 -5.998 -1.472 -7.994 0 -0.565 -0.04 -0.696 -0.232 -0.877l-0.232 -0.222H50.03c-17.258 0 -18.266 0.01 -18.468 0.181' fill='rgba(9,20,25,0.95)'/%3E%3Cpath d='M31.563 3.609c-0.202 0.151 -0.232 0.323 -0.313 1.532 -0.222 3.216 -0.817 5.877 -1.915 8.619 -2.036 5.101 -5.413 9.415 -9.879 12.621 -4.304 3.085 -9.365 4.859 -14.657 5.131 -1.069 0.06 -1.341 0.111 -1.492 0.262 -0.171 0.171 -0.181 0.857 -0.181 18.679s0.01 18.508 0.181 18.679c0.161 0.161 0.423 0.202 1.694 0.252 10.131 0.444 19.577 7.016 23.881 16.603 1.371 3.044 2.198 6.421 2.329 9.425 0.06 1.431 0.091 1.603 0.302 1.804 0.141 0.141 1.966 0.161 18.498 0.161 18.206 0 18.337 0 18.538 -0.202 0.151 -0.151 0.202 -0.333 0.202 -0.736 0 -0.282 0.05 -1.048 0.101 -1.683 0.938 -10.403 7.913 -19.647 17.792 -23.569 2.752 -1.089 5.444 -1.673 8.478 -1.825 0.958 -0.04 1.482 -0.111 1.593 -0.202 0.151 -0.121 0.161 -1.754 0.161 -18.72V31.865l-0.222 -0.151c-0.151 -0.111 -0.454 -0.161 -0.897 -0.161 -1.593 0 -4.103 -0.373 -6.19 -0.907 -3.528 -0.917 -7.379 -2.883 -10.383 -5.313 -2.117 -1.704 -4.677 -4.597 -6.149 -6.946 -0.998 -1.593 -2.097 -3.881 -2.812 -5.867 -0.746 -2.097 -1.472 -5.998 -1.472 -7.994 0 -0.565 -0.04 -0.696 -0.232 -0.877l-0.232 -0.222H50.03c-17.258 0 -18.266 0.01 -18.468 0.181m34.506 3.407c0.333 3.276 1.411 6.905 3.034 10.192 2.419 4.889 6.048 9.012 10.635 12.077 3.881 2.591 8.478 4.345 12.752 4.879 0.504 0.071 1.058 0.141 1.24 0.171l0.323 0.05v32.127l-0.675 0.071c-4.778 0.484 -9.516 2.238 -13.8 5.101 -6.119 4.093 -10.827 10.685 -12.692 17.762 -0.363 1.371 -0.857 4.062 -0.857 4.657 0 0.212 -0.06 0.353 -0.161 0.393 -0.091 0.03 -7.258 0.06 -15.927 0.06H34.173l-0.091 -0.232c-0.05 -0.121 -0.141 -0.665 -0.212 -1.21 -0.726 -6.149 -3.901 -12.611 -8.448 -17.248 -1.825 -1.855 -3.135 -2.944 -5.262 -4.365 -3.74 -2.49 -8.135 -4.163 -12.621 -4.798L5.948 66.482V34.385l0.433 -0.05c3.085 -0.413 3.81 -0.565 6.169 -1.29 3.69 -1.139 7.651 -3.367 10.827 -6.089 5.595 -4.798 9.385 -11.643 10.444 -18.841 0.081 -0.615 0.181 -1.26 0.212 -1.442l0.05 -0.323h31.915z' fill='%23D4B86A'/%3E%3C/svg%3E`;
                                    
                                    const systemFrameStyle = {
                                        borderStyle: 'solid',
                                        borderWidth: '10px 20px',
                                        borderImageSource: `url("${SYSTEM_FRAME_SVG}")`,
                                        borderImageSlice: '42 fill',
                                        borderImageWidth: '24px',
                                        borderImageRepeat: 'stretch',
                                        backgroundColor: 'transparent',
                                        color: '#E4C87A',
                                        textShadow: '0 0 8px rgba(228, 200, 122, 0.3)'
                                    };

                                    return parasBlocks.map((block, bIdx) => {
                                        if (block.type === 'multiline') {
                                            const alignClass = block.items.length === 1 ? 'text-center' : 'text-left';
                                            return (
                                                <div key={`multi-${bIdx}`} style={systemFrameStyle} className={`mx-auto w-fit min-w-[80px] max-w-[100%] my-0 shadow-xl px-0 pt-[4px] pb-0 ${alignClass}`}>
                                                    {block.items.map((item: any, iIdx: number) => {
                                                        const { paragraph, pIdx, segmentsList, previousOpenCount } = item;
                                                        if (!paragraph.trim()) {
                                                            return <div key={`empty-${pIdx}`} className="h-4" />;
                                                        }

                                                        const globalOffset = segmentGlobalOffset;
                                                        segmentGlobalOffset += segmentsList.length;

                                                        let containerMB = (iIdx === block.items.length - 1) ? '0px' : `${PARAGRAPH_SPACINGS[paragraphSpacingIndex]}px`;
                                                        let segmentSystemFrame = previousOpenCount > 0;

                                                        return (
                                                            <div key={pIdx} style={{ marginBottom: containerMB }} className="text-[#E4C87A] leading-relaxed">
                                                                {segmentsList.map((segment: string, sIdx: number) => {
                                                                    const globalIdx = globalOffset + sIdx;
                                                                    const isHighlighted = isTTSPlaying && ttsIndex === globalIdx;
                                                                    
                                                                    const contextStarts = segmentSystemFrame;
                                                                    const segOpens = (segment.match(/【/g) || []).length;
                                                                    const segCloses = (segment.match(/】/g) || []).length;
                                                                    if (segOpens > segCloses) segmentSystemFrame = true;
                                                                    else if (segCloses > segOpens) segmentSystemFrame = false;

                                                                    return (
                                                                        <span 
                                                                            key={sIdx}
                                                                            data-tts-index={globalIdx}
                                                                            className={`transition-all duration-300 rounded px-1 -mx-1 ${isHighlighted ? 'bg-app-accent/20 text-white shadow-[0_0_15px_rgba(var(--app-accent-rgb),0.3)]' : ''}`}
                                                                        >
                                                                            <DialogueLine line={segment} settings={settings} isHighlighted={isHighlighted} inSystemContext={contextStarts} inMultilineSystem={true} />
                                                                            {' '}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        } else {
                                            const { paragraph, pIdx, segmentsList, previousOpenCount } = block.data;
                                            if (!paragraph.trim()) return <div key={pIdx} className="h-4" />;

                                            const globalOffset = segmentGlobalOffset;
                                            segmentGlobalOffset += segmentsList.length;
                                            
                                            let segmentSystemFrame = previousOpenCount > 0;

                                            return (
                                                <div key={pIdx} style={{ marginBottom: `${PARAGRAPH_SPACINGS[paragraphSpacingIndex]}px` }}>
                                                    {segmentsList.map((segment: string, sIdx: number) => {
                                                        const globalIdx = globalOffset + sIdx;
                                                        const isHighlighted = isTTSPlaying && ttsIndex === globalIdx;
                                                        
                                                        const contextStarts = segmentSystemFrame;
                                                        const segOpens = (segment.match(/【/g) || []).length;
                                                        const segCloses = (segment.match(/】/g) || []).length;
                                                        if (segOpens > segCloses) segmentSystemFrame = true;
                                                        else if (segCloses > segOpens) segmentSystemFrame = false;

                                                        return (
                                                            <span 
                                                                key={sIdx}
                                                                data-tts-index={globalIdx}
                                                                className={`transition-all duration-300 rounded px-1 -mx-1 ${isHighlighted ? 'bg-app-accent/20 text-white shadow-[0_0_15px_rgba(var(--app-accent-rgb),0.3)]' : ''}`}
                                                            >
                                                                <DialogueLine line={segment} settings={settings} isHighlighted={isHighlighted} inSystemContext={contextStarts} inMultilineSystem={false} />
                                                                {' '}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }
                                    });
                                })()}
                            </article>
                        ) : (
                            <div className="text-center text-app-textMuted pt-20">
                                <h2 className="text-2xl font-semibold mb-2">Trình Đọc Truyện</h2>
                                <p className="text-base">Tải lên một file .txt để bắt đầu đọc.</p>
                            </div>
                        )}
                    </div>
                </div>
                {currentChapter && (
                    <div className="max-w-3xl mx-auto pb-20">
                         <ChapterNavigation 
                            chapters={readerChapters} 
                            currentIndex={currentReaderChapterIndex} 
                            onChapterChange={handleChapterChange} 
                            dropdownDirection="up"
                        />
                    </div>
                )}
            </div>

            {isSettingsVisible && (
                <div ref={settingsRef} className="fixed top-20 right-4 bg-app-surface border border-app-border rounded-xl shadow-2xl p-4 w-full max-w-sm text-white space-y-6 z-30 max-h-[85vh] overflow-y-auto">
                    {/* 1. Theme */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <PaletteIcon />
                                <span className="text-white text-sm font-medium">Theme</span>
                            </div>
                            <div className="flex bg-[#2A2D2F] rounded-lg p-0.5">
                                <button 
                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, themeColor: '#04DA98'}}))}
                                    className={`px-3 py-1 text-[10px] rounded-md transition-all ${settings.themeColor === '#04DA98' || !settings.themeColor ? 'bg-app-accent text-[#0A0A0A] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Xanh
                                </button>
                                <button 
                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, themeColor: '#F0BC85'}}))}
                                    className={`px-3 py-1 text-[10px] rounded-md transition-all ${settings.themeColor === '#F0BC85' ? 'bg-app-accent text-[#0A0A0A] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Nâu
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Khu vực chỉnh dòng-cỡ chữ */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <SettingControl icon={<LineHeightIcon />} label="Giãn dòng" value={`${Math.round(LINE_HEIGHTS[lineHeightIndex] * 100)}%`} onDecrement={() => setReadState(p => ({...p, settings: {...p.settings, lineHeightIndex: Math.max(0, p.settings.lineHeightIndex - 1)}}))} onIncrement={() => setReadState(p => ({...p, settings: {...p.settings, lineHeightIndex: Math.min(LINE_HEIGHTS.length - 1, p.settings.lineHeightIndex + 1)}}))} />
                        <SettingControl icon={<ParagraphSpacingIcon />} label="Xuống dòng" value={`${PARAGRAPH_SPACINGS[paragraphSpacingIndex]}px`} onDecrement={() => setReadState(p => ({...p, settings: {...p.settings, paragraphSpacingIndex: Math.max(0, p.settings.paragraphSpacingIndex - 1)}}))} onIncrement={() => setReadState(p => ({...p, settings: {...p.settings, paragraphSpacingIndex: Math.min(PARAGRAPH_SPACINGS.length - 1, p.settings.paragraphSpacingIndex + 1)}}))} />
                        <SettingControl icon={<FontSizeIcon />} label="Cỡ chữ" value={`${FONT_SIZES[fontSizeIndex]}px`} onDecrement={() => setReadState(p => ({...p, settings: {...p.settings, fontSizeIndex: Math.max(0, p.settings.fontSizeIndex - 1)}}))} onIncrement={() => setReadState(p => ({...p, settings: {...p.settings, fontSizeIndex: Math.min(FONT_SIZES.length - 1, p.settings.fontSizeIndex + 1)}}))} />
                        <SettingControl icon={<WidthIcon />} label="Chiều rộng khung" value={`${currentContainerWidth}px`} onDecrement={handleWidthDecrement} onIncrement={handleWidthIncrement} />
                    </div>
                    
                    {/* 3. Khu vực font */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3"><FontIcon /><span className="text-white text-sm">Font chữ</span></div>
                            <CustomDropdown
                                options={[
                                    ...FONTS.map(f => ({ value: f, label: f, group: 'Mặc định' })),
                                    ...customFonts.map(f => ({ value: f.name, label: f.name, group: 'Tùy chỉnh' }))
                                ]}
                                value={fontFamily}
                                onChange={(val) => setReadState(p => ({...p, settings: {...p.settings, fontFamily: val}}))}
                                placeholder="Chọn Font"
                                className="w-[160px]"
                                buttonClassName="bg-[#2A2D2F] px-3 py-1.5 text-sm"
                                menuClassName="bg-[#2A2D2F]"
                                renderOption={(option) => (
                                    <span className="truncate" style={{ fontFamily: option.value }}>
                                        {option.label}
                                    </span>
                                )}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3"><HeadingFontIcon /><span className="text-white text-sm">Font tiêu đề</span></div>
                            <CustomDropdown
                                options={[
                                    ...FONTS.map(f => ({ value: f, label: f, group: 'Mặc định' })),
                                    ...customFonts.map(f => ({ value: f.name, label: f.name, group: 'Tùy chỉnh' }))
                                ]}
                                value={titleFontFamily || 'Texturina_48pt-Bold'}
                                onChange={(val) => setReadState(p => ({...p, settings: {...p.settings, titleFontFamily: val}}))}
                                placeholder="Chọn Font"
                                className="w-[160px]"
                                buttonClassName="bg-[#2A2D2F] px-3 py-1.5 text-sm"
                                menuClassName="bg-[#2A2D2F]"
                                renderOption={(option) => (
                                    <span className="truncate" style={{ fontFamily: option.value }}>
                                        {option.label}
                                    </span>
                                )}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <UploadIcon />
                                <span className="text-white text-sm">Tải lên Font (.ttf/.otf)</span>
                            </div>
                            <input 
                                type="file" 
                                accept=".ttf,.otf" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const dataUrl = event.target?.result as string;
                                            const fontName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                                            setCustomFonts(prev => {
                                                if (!prev.some(f => f.name === fontName)) {
                                                    return [...prev, { name: fontName, dataUrl }];
                                                }
                                                return prev;
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                    // Reset input so the same file can be uploaded again if needed
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-[#2A2D2F] border border-white/10 hover:border-white/20 rounded-xl px-3 py-1.5 text-sm text-white transition-all focus:outline-none focus:ring-1 focus:ring-app-accent shadow-sm"
                            >
                                Tải lên
                            </button>
                        </div>
                    </div>

                    {/* 4. Khu vực màu background */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: backgroundColor || '#1B1D1E' }}></div>
                                <span className="text-white text-sm">Màu background</span>
                            </div>
                            <button 
                                onClick={openColorPicker}
                                className="bg-[#2A2D2F] border border-white/10 hover:border-white/20 rounded-xl px-3 py-1.5 text-sm text-white transition-all focus:outline-none focus:ring-1 focus:ring-app-accent shadow-sm"
                            >
                                Chọn màu
                            </button>
                        </div>
                    </div>

                    {/* 5. Khu vực bubble chat */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <ChatBubbleIcon />
                                <span className="text-white text-sm">Làm đẹp lời thoại</span>
                            </div>
                            <button 
                                onClick={() => setReadState(p => ({...p, settings: {...p.settings, beautifyDialogue: !p.settings.beautifyDialogue}}))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-app-accent focus:ring-offset-1 focus:ring-offset-[#1B1D1E] ${settings.beautifyDialogue ? 'bg-app-accent' : 'bg-[#2A2D2F]'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.beautifyDialogue ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="w-5 h-5 flex items-center justify-center font-bold text-app-accent">【</span>
                                <span className="text-white text-sm">Bật Khung hệ thống</span>
                            </div>
                            <button 
                                onClick={() => setReadState(p => ({...p, settings: {...p.settings, systemFrame: !p.settings.systemFrame}}))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-app-accent focus:ring-offset-1 focus:ring-offset-[#1B1D1E] ${settings.systemFrame ? 'bg-app-accent' : 'bg-[#2A2D2F]'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.systemFrame ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {settings.beautifyDialogue && (
                            <div className="space-y-3 pl-9 pt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-app-textMuted">Kiểu bong bóng</span>
                                    <div className="flex bg-[#2A2D2F] rounded-lg p-0.5">
                                        <button 
                                            onClick={() => setReadState(p => ({...p, settings: {...p.settings, dialoguePreset: 'modern', bubbleTextColor: '#04DA98'}}))}
                                            className={`px-3 py-1 text-[10px] rounded-md transition-all ${settings.dialoguePreset !== 'classic' ? 'bg-app-accent text-[#0A0A0A] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Hiện đại
                                        </button>
                                        <button 
                                            onClick={() => setReadState(p => ({...p, settings: {...p.settings, dialoguePreset: 'classic', bubbleTextColor: '#D7D5D1'}}))}
                                            className={`px-3 py-1 text-[10px] rounded-md transition-all ${settings.dialoguePreset === 'classic' ? 'bg-app-accent text-[#0A0A0A] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Cổ điển
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-app-textMuted">Màu chữ</span>
                                    <div className="flex items-center space-x-3">
                                        {settings.dialoguePreset === 'classic' ? (
                                            <>
                                                <button 
                                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleTextColor: '#D7D5D1'}}))}
                                                    className={`w-5 h-5 rounded-md border-2 transition-all ${settings.bubbleTextColor?.toUpperCase() === '#D7D5D1' ? 'border-white scale-110 shadow-[0_0_8px_rgba(215,213,209,0.4)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: '#D7D5D1' }}
                                                    title="Trắng"
                                                />
                                                <button 
                                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleTextColor: '#E6E6DA'}}))}
                                                    className={`w-5 h-5 rounded-md border-2 transition-all ${settings.bubbleTextColor?.toUpperCase() === '#E6E6DA' ? 'border-white scale-110 shadow-[0_0_8px_rgba(230,230,218,0.4)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: '#E6E6DA' }}
                                                    title="Ngà"
                                                />
                                                <button 
                                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleTextColor: '#BF966A'}}))}
                                                    className={`w-5 h-5 rounded-md border-2 transition-all ${settings.bubbleTextColor?.toUpperCase() === '#BF966A' ? 'border-white scale-110 shadow-[0_0_8px_rgba(191,150,106,0.4)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: '#BF966A' }}
                                                    title="Nâu sáng"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleTextColor: '#04DA98'}}))}
                                                    className={`w-5 h-5 rounded-md border-2 transition-all ${settings.bubbleTextColor?.toUpperCase() === '#04DA98' ? 'border-white scale-110 shadow-[0_0_8px_rgba(4,218,152,0.6)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: '#04DA98' }}
                                                    title="Xanh sáng"
                                                />
                                                <button 
                                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleTextColor: '#10A673'}}))}
                                                    className={`w-5 h-5 rounded-md border-2 transition-all ${settings.bubbleTextColor?.toUpperCase() === '#10A673' ? 'border-white scale-110 shadow-[0_0_8px_rgba(15,152,106,0.6)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: '#10A673' }}
                                                    title="Xanh tối"
                                                />
                                                <button 
                                                    onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleTextColor: '#FFFFFF'}}))}
                                                    className={`w-5 h-5 rounded-md border-2 transition-all ${settings.bubbleTextColor?.toUpperCase() === '#FFFFFF' || settings.bubbleTextColor === 'white' ? 'border-app-accent scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: '#FFFFFF' }}
                                                    title="Trắng"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <span className="text-sm text-white">Vị trí bong bóng chat</span>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleOffset: (p.settings.bubbleOffset || 0) - 1}}))}
                                            className="p-1.5 rounded-full bg-[#2A2D2F] text-app-accent hover:bg-app-accent hover:text-white transition-colors"
                                            title="Lên trên"
                                        >
                                            <ArrowUpIcon />
                                        </button>
                                        <button 
                                            onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleOffset: (p.settings.bubbleOffset || 0) + 1}}))}
                                            className="p-1.5 rounded-full bg-[#2A2D2F] text-app-accent hover:bg-app-accent hover:text-white transition-colors"
                                            title="Xuống dưới"
                                        >
                                            <ArrowDownIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => setReadState(p => ({...p, settings: {...p.settings, bubbleOffset: 0}}))}
                                        className="text-xs text-app-textMuted hover:text-white transition-colors underline"
                                    >
                                        Reset vị trí bubble chat
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {isColorPickerVisible && (
                <ColorPicker 
                    color={backgroundColor || '#1B1D1E'} 
                    recentColors={settings.recentColors || ['#F4ECD8', '#E3EDCD', '#E8E9EA', '#1B1D1E', '#000000', '#FFFFFF']}
                    onChange={(color) => setReadState(p => ({...p, settings: {...p.settings, backgroundColor: color}}))} 
                    onConfirm={confirmColorPicker}
                    onClose={closeColorPicker} 
                />
            )}

            <FloatingPlayPauseButton 
                isVisible={isTTSPlaying} 
                isPaused={isTTSPaused}
                onClick={() => setIsTTSPaused(!isTTSPaused)} 
                className="fixed bottom-10 right-10"
                size="lg"
            />
        </div>
    );
};

export default ReadViewDesktop;
