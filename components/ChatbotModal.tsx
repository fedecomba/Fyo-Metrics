import React, { useState, useEffect, useRef } from 'react';
import type { EvaluationResult, ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { XIcon, MessageCircleQuestionIcon, SendIcon, UserCircleIcon } from './Icons';

interface ChatbotModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysisResult: EvaluationResult;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose, analysisResult }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([
                {
                    role: 'model',
                    content: `Hola, soy tu asistente de IA. Tengo el contexto completo del análisis de **${analysisResult.colaborador}**. ¿Qué te gustaría explorar en más detalle?`
                }
            ]);
            setError(null);
        } else {
            // Reset state when modal is closed
            setMessages([]);
            setUserInput('');
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen, analysisResult]);

    useEffect(() => {
        // Auto-scroll to the latest message
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;
        
        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await sendChatMessage(analysisResult, updatedMessages);
            
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        const newMessages = JSON.parse(JSON.stringify(prev)); // Deep copy
                        newMessages[prev.length - 1].content += chunkValue;
                        return newMessages;
                    }
                    return prev;
                });
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error al obtener la respuesta.';
            setError(errorMessage);
            // Don't remove the user message on error, so they can retry or copy it.
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="bg-[#008EAA]/10 p-2 rounded-full">
                            <MessageCircleQuestionIcon className="w-6 h-6 text-[#008EAA]" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Asistente de IA</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"
                        aria-label="Cerrar modal"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Chat Area */}
                <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="bg-[#008EAA] text-white p-2 rounded-full flex-shrink-0">
                                    <MessageCircleQuestionIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div 
                                className={`max-w-md p-3 rounded-xl whitespace-pre-wrap text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-[#008EAA] text-white rounded-br-none' 
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                                }`}
                                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                            />
                             {msg.role === 'user' && (
                                <div className="bg-slate-200 p-2 rounded-full flex-shrink-0">
                                    <UserCircleIcon className="w-5 h-5 text-slate-600"/>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && messages[messages.length-1].role !== 'model' && (
                         <div className="flex items-start gap-3">
                            <div className="bg-[#008EAA] text-white p-2 rounded-full flex-shrink-0">
                                <MessageCircleQuestionIcon className="w-5 h-5" />
                            </div>
                            <div className="max-w-md p-3 rounded-xl bg-white border border-slate-200 text-slate-700 rounded-bl-none flex items-center gap-2">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                            </div>
                         </div>
                    )}
                    {error && (
                        <div className="text-center text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <p><strong>Error:</strong> {error}</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-200 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Haz una pregunta sobre el análisis..."
                            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA]"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !userInput.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#008EAA] text-white rounded-full hover:bg-[#006F8A] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#008EAA] disabled:bg-[#008EAA]/50 disabled:cursor-not-allowed"
                            aria-label="Enviar mensaje"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};