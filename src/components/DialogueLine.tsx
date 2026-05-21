import React from 'react';
import { ReaderSettings } from '../types';

interface DialogueLineProps {
    line: string;
    settings: ReaderSettings;
    isHighlighted?: boolean;
    inSystemContext?: boolean;
    inMultilineSystem?: boolean;
}

interface Chunk {
    text: string;
    isSystem: boolean;
}

const DialogueLine: React.FC<DialogueLineProps> = ({ line, settings, isHighlighted, inSystemContext = false, inMultilineSystem = false }) => {
    if (!line) return <>&nbsp;</>;
    
    let currentInSys = inSystemContext;
    const chunks: Chunk[] = [];
    let buffer = "";

    // Early exit if no system frame parsing needed
    if (!settings.systemFrame && !inSystemContext && !line.includes('【') && !line.includes('】')) {
        chunks.push({ text: line, isSystem: false });
    } else {
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '【') {
                if (buffer) {
                    chunks.push({ text: buffer, isSystem: currentInSys });
                    buffer = "";
                }
                currentInSys = true;
                buffer += char;
            } else if (char === '】') {
                buffer += char;
                chunks.push({ text: buffer, isSystem: currentInSys });
                buffer = "";
                currentInSys = false;
            } else {
                buffer += char;
            }
        }
        if (buffer) {
            chunks.push({ text: buffer, isSystem: currentInSys });
        }
    }

    const regex = /(“[^”]*”|"[^"]*"|«[^»]*»)/g;
    const preset = settings.dialoguePreset || 'modern';

    return (
        <>
            {chunks.map((chunk, chunkIdx) => {
                if (settings.systemFrame && chunk.isSystem) {
                    if (inMultilineSystem) {
                        return <span key={`sys-${chunkIdx}`}>{chunk.text}</span>;
                    }
                    return (
                        <span 
                            key={`sys-${chunkIdx}`}
                            className="box-decoration-clone bg-[#D4B86A]/20 border border-[#D4B86A]/50 text-white px-1.5 py-0.5 rounded align-baseline transition-all duration-300"
                        >
                            {chunk.text}
                        </span>
                    );
                }

                if (!settings.beautifyDialogue) {
                    return <span key={`chunk-${chunkIdx}`} className={isHighlighted ? 'text-white' : ''}>{chunk.text}</span>;
                }

                // Normal dialogue parsing for non-system text
                const parts = chunk.text.split(regex);
                return (
                    <span key={`chunk-${chunkIdx}`}>
                        {parts.map((part, index) => {
                            const isQuote = index % 2 === 1;
                            
                            if (isQuote && part.match(/^(“[^”]*”|"[^"]*"|«[^»]*»)$/)) {
                                const prevPart = parts[index - 1];
                                const isStartOfLine = (!prevPart || prevPart.trim().length === 0) && chunkIdx === 0;
                                const isPrecededByColon = prevPart && prevPart.trim().endsWith(':');
                                
                                if (isStartOfLine || isPrecededByColon) {
                                    if (preset === 'classic') {
                                        return (
                                            <span 
                                                key={index} 
                                                style={{ 
                                                    transform: `translateY(${settings.bubbleOffset || 0}px)`,
                                                    backgroundColor: isHighlighted ? 'rgba(var(--app-accent-rgb), 0.3)' : '#2D241E',
                                                    borderColor: isHighlighted ? 'rgba(var(--app-accent-rgb), 0.6)' : '#8B6D4D',
                                                    color: settings.bubbleTextColor || '#D7D5D1',
                                                    boxShadow: isHighlighted ? '0 0 20px rgba(var(--app-accent-rgb), 0.4)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }} 
                                                className="relative inline-block border mx-1 px-3 pt-[6px] pb-[2px] rounded-sm align-baseline break-words transition-all duration-300"
                                            >
                                                <span className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${isHighlighted ? 'border-app-accent' : 'border-[#8B6D4D]'}`}></span>
                                                <span className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r ${isHighlighted ? 'border-app-accent' : 'border-[#8B6D4D]'}`}></span>
                                                <span className={`absolute -bottom-1 -left-1 w-2 h-2 border-b border-l ${isHighlighted ? 'border-app-accent' : 'border-[#8B6D4D]'}`}></span>
                                                <span className={`absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${isHighlighted ? 'border-app-accent' : 'border-[#8B6D4D]'}`}></span>
                                                
                                                <span className="relative z-10">
                                                    {part}
                                                </span>
                                            </span>
                                        );
                                    }

                                    return (
                                        <span 
                                            key={index} 
                                            style={{ 
                                                color: settings.bubbleTextColor, 
                                                transform: `translateY(${settings.bubbleOffset || 0}px)`,
                                                backgroundColor: isHighlighted ? 'rgba(var(--app-accent-rgb), 0.25)' : '#061711',
                                                borderColor: isHighlighted ? 'rgba(var(--app-accent-rgb), 0.5)' : '#094733',
                                                boxShadow: isHighlighted ? '0 0 15px rgba(var(--app-accent-rgb), 0.3)' : 'none'
                                            }} 
                                            className="inline-block border px-2 py-0.5 rounded-2xl rounded-tl-none mx-1 align-baseline transition-all duration-300"
                                        >
                                            {part}
                                        </span>
                                    );
                                }
                            }
                            return <span key={index} className={isHighlighted ? 'text-white' : ''}>{part}</span>;
                        })}
                    </span>
                );
            })}
        </>
    );
};

export default DialogueLine;
