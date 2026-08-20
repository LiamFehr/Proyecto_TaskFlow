import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface ColaResponse {
    waitList: any[];
    activeCashiers: any[];
    lastCalled: any | null;
}

const FilaPage: React.FC = () => {
    const [waitList, setWaitList] = useState<any[]>([]);
    const [activeCashiers, setActiveCashiers] = useState<any[]>([]);
    const [lastCalled, setLastCalled] = useState<any | null>(null);
    const prevOrderIdRef = useRef<string | null>(null);

    const [isSoundEnabled, setIsSoundEnabled] = useState(true);

    const announceOrder = (orderNum: string, boxNum: number) => {
        if (!isSoundEnabled) return;

        // Sound Effect
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => console.log("Audio play blocked."));

        // Voice Announcement (TTS)
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Orden número ${orderNum}, por favor acercarse a caja ${boxNum}`);
            utterance.lang = 'es-AR'; // Argentine Spanish
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        const fetchCola = async () => {
            try {
                const response = await fetch("/api/pedidos/cola");
                const data: ColaResponse = await response.json();

                // Sound logic: Si el numeroOrden de lastCalled cambia respecto al REF
                if (data.lastCalled && data.lastCalled.numeroOrden !== prevOrderIdRef.current) {
                    // Call the new announceOrder function
                    announceOrder(data.lastCalled.numeroOrden, data.lastCalled.caja || 1); // Assuming 'caja' property exists or defaults to 1
                    prevOrderIdRef.current = data.lastCalled.numeroOrden;
                }

                setWaitList(data.waitList || []);
                setActiveCashiers(data.activeCashiers || []);
                setLastCalled(data.lastCalled);
            } catch (error) {
                console.error("Error fetching queue:", error);
            }
        };

        fetchCola();

        // WebSocket STOMP for real-time announcements
        const socketUrl = '/ws-next-system'; // Same origin routing
        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            debug: () => { /* noop */ },
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('Fila conectada al WebSocket');
            // Cuando una caja cambia estado/toma pedido, refrescar la Fila
            client.subscribe('/topic/status-sincro', () => fetchCola());
            client.subscribe('/topic/pedidos-entrantes', () => fetchCola());
        };

        client.activate();

        // Fallback polling super lento (15 seg)
        const interval = setInterval(fetchCola, 15000);
        return () => {
            clearInterval(interval);
            client.deactivate();
        };
    }, [isSoundEnabled]);

    return (
        <div className="flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden font-sans">
            {/* Main Area: 50/50 Split (Cashiers & Next Order) */}
            <div className="flex-1 flex flex-col p-12 gap-12 border-r border-white/5 relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
                </div>

                {/* Top 50%: Active Cashiers */}
                <div className="h-1/2 flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-white tracking-widest uppercase font-mono italic">
                                STATUS_CAJAS
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.3em]">Sistema Operativo</span>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Puntos de Entrega: {activeCashiers.length}/5</span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-5 gap-8">
                        {activeCashiers.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 backdrop-blur-sm"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <span className="text-blue-400/60 text-sm font-black mb-2 font-mono tracking-tighter">TERMINAL_{idx + 1}</span>
                                <span className="text-7xl font-black text-white font-mono tabular-nums leading-none tracking-[-0.08em] drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{order.numeroOrden}</span>
                                <div className="mt-4 px-5 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <span className="text-xs font-black text-blue-300 truncate max-w-[140px] block uppercase tracking-tight">
                                        {order.clienteNombre || "C. FINAL"}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                        {[...Array(5 - activeCashiers.length)].map((_, i) => (
                            <div key={i} className="border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center bg-black/20 group opacity-30">
                                <div className="w-12 h-12 border-2 border-white/10 rounded-full flex items-center justify-center mb-4 group-hover:border-white/20 transition-colors">
                                    <div className="w-5 h-1 bg-white/10 rounded-full" />
                                </div>
                                <span className="text-white/20 font-black tracking-[0.3em] text-[10px] uppercase">OFFLINE</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom 50%: Next Ticket Area */}
                <div className="h-1/2 flex items-center justify-center relative z-10">
                    <AnimatePresence mode="wait">
                        {lastCalled ? (
                            <motion.div
                                key={lastCalled.numeroOrden}
                                initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                exit={{ scale: 1.2, opacity: 0, filter: 'blur(20px)' }}
                                transition={{ type: 'spring', damping: 15 }}
                                className="w-full h-full bg-gradient-to-br from-blue-600/10 to-indigo-600/5 rounded-[4rem] flex flex-col items-center justify-center border border-white/10 shadow-[0_80px_160px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md"
                            >
                                {/* Decorative scanner animation */}
                                <motion.div
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                                    className="absolute left-0 w-full h-[1px] bg-blue-500/40 shadow-[0_0_20px_#3b82f6] z-0"
                                />

                                <div className="relative flex flex-col items-center text-center w-full px-20">
                                    <span className="text-blue-400 font-bold uppercase tracking-[0.5em] text-xs mb-4 opacity-70">Turno Actual</span>

                                    {/* Number with Terminal Style */}
                                    <h2 className="text-[32vh] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.1)] tabular-nums font-mono italic">
                                        {lastCalled.numeroOrden}
                                    </h2>

                                    {/* Name with subtle border */}
                                    <div className="mt-8 px-12 py-4 bg-white/5 border border-white/10 rounded-[3rem] shadow-xl">
                                        <p className="text-[9vh] font-black text-blue-400 uppercase tracking-tighter truncate max-w-[80vw]">
                                            {lastCalled.clienteNombre || "SIGUIENTE"}
                                        </p>
                                    </div>
                                </div>

                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute bottom-12 px-10 py-3 bg-blue-500/20 rounded-full border border-blue-500/30"
                                >
                                    <span className="text-[11px] font-black text-blue-300 uppercase tracking-[0.4em]">Por favor, diríjase a su caja</span>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 opacity-40">
                                <div className="w-2 relative">
                                    <div className="w-24 h-24 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 font-mono text-xs">SYS</div>
                                </div>
                                <span className="text-xl font-black text-white/50 uppercase tracking-[0.4em] font-mono animate-pulse">Sync_Fila_Data...</span>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Lateral Queue Area: Fixed width */}
            <div className="w-[400px] flex flex-col bg-black/40 backdrop-blur-3xl border-l border-white/5 relative z-20">
                <div className="p-12 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-[0.4em] mb-2 font-mono italic">QUEUE_SYSTEM_v2</span>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">En Cola</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{waitList.length} Pedidos en espera</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar bg-black/10">
                    <AnimatePresence>
                        {waitList.map((order: any) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 shadow-xl"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-widest mb-1 font-mono italic">ORDN_PEND</span>
                                    <span className="text-4xl font-black text-white tracking-tighter font-mono">{order.numeroOrden}</span>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="px-3 py-1 bg-emerald-500/10 rounded-lg mb-3 border border-emerald-500/20">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">READY</span>
                                    </div>
                                    <span className="text-xs font-black text-white/50 truncate max-w-[140px] uppercase tracking-tight">
                                        {order.clienteNombre || "S/N"}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {waitList.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-32">
                            <div className="w-20 h-20 bg-white/20 rounded-full mb-6 border-4 border-white/5 animate-pulse" />
                            <p className="text-sm font-black uppercase tracking-[0.3em] text-center text-white/50">Vacío<br />A la espera</p>
                        </div>
                    )}
                </div>

                {/* Footer Decorator */}
                <div className="p-8 border-t border-white/5 bg-black/20 text-center relative">
                    <p className="text-[9px] font-black text-blue-500/30 uppercase tracking-[0.5em] font-mono italic">TASKFLOW_TERMINAL_2026</p>

                    {/* Floating Mute Toggle */}
                    <button
                        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                        className={`absolute right-8 bottom-24 p-4 rounded-full backdrop-blur-3xl border transition-all duration-500 ${isSoundEnabled
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                : 'bg-white/5 border-white/10 text-white/30'
                            }`}
                        title={isSoundEnabled ? "Desactivar Sonido" : "Activar Sonido"}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isSoundEnabled ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilaPage;
