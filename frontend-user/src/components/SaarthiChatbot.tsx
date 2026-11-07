'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SaarthiChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Namaste! 🙏 I\'m **Saarthi**, your MargRakshak companion.\n\nAsk me anything about traffic rules, vehicle regulations, road safety, or how to use the portal. I\'m here to help! 🚗',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history (exclude welcome message)
            const history = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_BASE}/chatbot/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history }),
            });

            const data = await response.json();

            if (data.success && data.reply) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date(),
                }]);
            } else {
                throw new Error(data.error || 'No reply received');
            }
        } catch (error: any) {
            console.error('Saarthi error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: error.message?.includes('unavailable')
                    ? 'I\'m a bit busy right now 😅 Please wait a moment and try again!'
                    : 'Sorry, I\'m having trouble connecting right now. Please try again in a moment. 🔄',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(input);
        }
    };

    // Advanced Markdown-like rendering
    const renderContent = (content: string) => {
        const lines = content.split('\n');
        return (
            <div className="space-y-1.5">
                {lines.map((line, lineIdx) => {
                    if (!line.trim()) return <div key={lineIdx} className="h-2" />; // paragraph spacing
                    
                    // Render bold text within each line
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    const rendered = parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                    });

                    // Handle bullet points
                    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                        return (
                            <div key={lineIdx} className="flex gap-2 pl-2">
                                <span className="text-primary-500 mt-0.5 text-xs">●</span>
                                <span className="flex-1">{rendered.slice(1)}</span>
                            </div>
                        );
                    }

                    // Numbered lists
                    if (/^\d+\.\s/.test(line.trim())) {
                        const match = line.trim().match(/^(\d+\.)\s(.*)/);
                        if (match) {
                            return (
                                <div key={lineIdx} className="flex gap-2 pl-1">
                                    <span className="text-primary-600 dark:text-primary-400 font-semibold">{match[1]}</span>
                                    <span className="flex-1">{
                                        match[2].split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
                                            }
                                            return <span key={i}>{part}</span>;
                                        })
                                    }</span>
                                </div>
                            );
                        }
                    }

                    return <div key={lineIdx}>{rendered}</div>;
                })}
            </div>
        );
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-gov-xl flex items-center justify-center border-4 border-white dark:border-gov-900 transition-shadow hover:shadow-gov-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #0e2450 0%, #1a4d9e 100%)', // gov-gradient
                        }}
                    >
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center overflow-hidden">
                            <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-full h-full object-cover p-1" />
                        </div>
                        <span className="absolute top-0 right-0 w-4 h-4 bg-[#f97316] rounded-full animate-pulse border-2 border-white dark:border-gov-900" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed z-50 bg-gray-50 dark:bg-gov-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-gray-200 dark:border-gov-700"
                        style={{
                            bottom: '24px',
                            right: '16px',
                            left: '16px',
                            maxHeight: 'calc(100vh - 48px)',
                            height: '600px',
                            // On larger screens, fix width and position from right
                            maxWidth: '420px',
                            marginLeft: 'auto',
                        }}>
                        
                        {/* Header */}
                        <div
                            className="px-6 py-5 flex items-center justify-between text-white flex-shrink-0 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #0e2450 0%, #1a4d9e 100%)' }}
                        >
                            {/* Decorative background accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#f97316]/20 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-md border-2 border-white/20">
                                    <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-full h-full object-contain rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-xl tracking-tight leading-tight">Saarthi</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Online</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative z-10"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Top Saffron Accent Line */}
                        <div className="h-1 w-full bg-[#f97316]" />

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5" style={{ scrollbarWidth: 'thin' }}>
                            {messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                    >
                                        {!isUser && index !== 0 && (
                                            <span className="text-[10px] font-semibold text-gov-400 ml-2 mb-1 uppercase tracking-wide">Saarthi</span>
                                        )}
                                        <div
                                            className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
                                                isUser
                                                    ? 'bg-[#1a4d9e] text-white rounded-br-sm shadow-md'
                                                    : 'bg-white dark:bg-gov-800 text-gov-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gov-700'
                                            }`}
                                        >
                                            {renderContent(msg.content)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {/* Loading Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-start"
                                >
                                    <span className="text-[10px] font-semibold text-gov-400 ml-2 mb-1 uppercase tracking-wide">Saarthi</span>
                                    <div className="bg-white dark:bg-gov-800 px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-gov-700">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-2 h-2 bg-[#1a4d9e] dark:bg-[#f97316] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-[#1a4d9e] dark:bg-[#f97316] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-[#1a4d9e] dark:bg-[#f97316] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Suggestions Grid */}
                        {messages.length <= 1 && (
                            <div className="px-5 pb-3 pt-1 flex-shrink-0 bg-gradient-to-t from-gray-50 dark:from-gov-900 to-transparent">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { emoji: '🚦', text: 'Traffic rules' },
                                        { emoji: '🕳️', text: 'Report pothole' },
                                        { emoji: '📄', text: 'E-Challans' },
                                        { emoji: '🚑', text: 'Emergency contacts' },
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(`${suggestion.emoji} ${suggestion.text}`)}
                                            disabled={isLoading}
                                            className="text-xs px-3 py-2.5 bg-white dark:bg-gov-800 text-gov-700 dark:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gov-700 transition-all border border-gray-200 dark:border-gov-700 disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5 font-medium hover:border-[#1a4d9e]/30 dark:hover:border-primary-500/30"
                                        >
                                            <span className="text-sm">{suggestion.emoji}</span> 
                                            <span className="truncate">{suggestion.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="px-5 py-4 bg-white dark:bg-gov-950 flex-shrink-0 border-t border-gray-100 dark:border-gov-800">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gov-900 rounded-2xl p-1.5 border border-gray-200 dark:border-gov-800 focus-within:ring-2 focus-within:ring-[#1a4d9e]/20 focus-within:border-[#1a4d9e] transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your question..."
                                    className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={() => handleSend(input)}
                                    disabled={!input.trim() || isLoading}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
                                    style={{
                                        background: input.trim() && !isLoading
                                            ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' // Saffron button when active
                                            : '#94a3b8',
                                    }}
                                >
                                    <svg className="w-5 h-5 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex justify-center items-center mt-2.5 gap-1.5">
                                <span className="text-[10px] font-medium text-gray-400 dark:text-gov-500 uppercase tracking-widest">Powered by AI (GPT-120B)</span>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
