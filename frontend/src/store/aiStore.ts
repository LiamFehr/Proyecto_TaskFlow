import { create } from 'zustand';
import axios from 'axios';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AiState {
    isOpen: boolean;
    isEnabled: boolean; // Backend toggle
    isAvailable: boolean; // Health check
    messages: Message[];
    isTyping: boolean;

    toggleChat: () => void;
    checkStatus: () => Promise<void>;
    sendMessage: (text: string) => Promise<void>;
}

export const useAiStore = create<AiState>((set, get) => ({
    isOpen: false,
    isEnabled: false,
    isAvailable: false,
    messages: [
        {
            id: 'welcome',
            text: '¡Hola! Soy tu asistente virtual de TaskFlow. ¿En qué puedo ayudarte hoy?',
            sender: 'ai',
            timestamp: new Date(),
        }
    ],
    isTyping: false,

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

    checkStatus: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('/api/ai/status', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Assuming response data is { available: true/false }
            set({ isAvailable: response.data.available, isEnabled: response.data.available });
        } catch (error) {
            console.error('Error checking AI status:', error);
            set({ isAvailable: false, isEnabled: false });
        }
    },

    sendMessage: async (text: string) => {
        const { messages } = get();
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        };

        set({ messages: [...messages, newMessage], isTyping: true });

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/ai/chat', { message: text }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const reply: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.response || 'Lo siento, no pude procesar tu solicitud.',
                sender: 'ai',
                timestamp: new Date(),
            };

            set((state) => ({
                messages: [...state.messages, reply],
                isTyping: false
            }));

        } catch (error) {
            console.error('Error sending message:', error);
            const errorReply: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Error de conexión con el agente IA.',
                sender: 'ai',
                timestamp: new Date(),
            };
            set((state) => ({
                messages: [...state.messages, errorReply],
                isTyping: false
            }));
        }
    },
}));
