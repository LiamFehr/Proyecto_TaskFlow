import { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Check } from 'lucide-react';
import { apiBase } from '../utils/request';
import { useAuthStore } from '../store/authStore';

interface Notification {
    id: number;
    titulo: string;
    mensaje: string;
    rolDestino: string;
    leida: boolean;
    fecha: string;
}

export default function NotificationBell({ role }: { role: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const token = useAuthStore((state) => state.token);
    const prevCountRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio for notification
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${apiBase}/v2/notificaciones/unread?role=${role}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                
                // Play sound if new notifications arrived
                if (data.length > prevCountRef.current) {
                    audioRef.current?.play().catch(() => console.log("Audio play blocked"));
                }
                prevCountRef.current = data.length;
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [role, token]);

    const markAsRead = async (id: number) => {
        try {
            const res = await fetch(`${apiBase}/v2/notificaciones/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        for (const n of notifications) {
            await markAsRead(n.id);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all group"
            >
                {notifications.length > 0 ? (
                    <BellRing className="w-6 h-6 text-blue-600 animate-bounce" />
                ) : (
                    <Bell className="w-6 h-6" />
                )}
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-[101] overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
                        <div className="p-6 border-b border-slate-50 bg-slate-900 flex items-center justify-between">
                            <h4 className="text-white font-black uppercase tracking-widest text-xs">Notificaciones</h4>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase underline"
                                >
                                    Limpiar todo
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center opacity-30">
                                    <Bell className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Sin novedades</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors group relative">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight mb-1">{n.titulo}</p>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.mensaje}</p>
                                                <p className="text-[9px] text-slate-400 font-mono mt-2">{new Date(n.fecha).toLocaleTimeString()}</p>
                                            </div>
                                            <button 
                                                onClick={() => markAsRead(n.id)}
                                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600 hover:text-white"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-4 bg-slate-50 text-center">
                             <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Cerrar Panel</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
