import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { ShoppingBag, ClipboardList, LogOut, FileText, Menu, X, Bell } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { http } from "../utils/request";

export default function VendedorLayout() {
    const logout = useAuthStore(s => s.logout);
    const token = useAuthStore(s => s.token);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await http.get('/v2/notificaciones/unread?role=VENDEDOR', token);
            setNotifications(data);
        } catch (e) {
            console.error("Error polling notifications", e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Cada 10s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await http.post(`/v2/notificaciones/${id}/read`, null, token);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-1 hover:bg-slate-800 rounded text-slate-300"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/assets/images/logo_navidad.png" alt="VHP" className="h-10 w-auto bg-white rounded-full p-0.5" />
                            <span className="font-bold text-lg hidden sm:block">Vendedor</span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/vendedor" className="flex items-center gap-2 text-sm font-medium hover:text-blue-300 transition-colors">
                            <ClipboardList size={18} /> Pedidos
                        </Link>
                        <Link to="/vendedor/ventas" className="flex items-center gap-2 text-sm font-medium hover:text-blue-300 transition-colors">
                            <ShoppingBag size={18} /> Ventas
                        </Link>
                        <Link to="/vendedor/presupuestador" className="flex items-center gap-2 text-sm font-medium hover:text-blue-300 transition-colors">
                            <FileText size={18} /> Presupuesto
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotif(!showNotif)}
                                className="p-2 hover:bg-slate-800 rounded-full relative transition-colors"
                            >
                                <Bell size={20} className={notifications.length > 0 ? "text-yellow-400" : "text-slate-300"} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotif && (
                                <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-white shadow-2xl rounded-2xl border border-slate-100 py-2 z-[60] text-slate-900 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Notificaciones</span>
                                        {notifications.length > 0 && <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{notifications.length} nuevas</span>}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-1 border-b border-slate-50 last:border-0">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm font-bold text-slate-800">{n.titulo}</span>
                                                        <button onClick={() => markAsRead(n.id)} className="text-[10px] text-blue-500 hover:underline font-bold">Leído</button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{n.mensaje}</p>
                                                    <span className="text-[9px] text-slate-300 uppercase font-bold mt-1">
                                                        {new Date(n.fecha).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-slate-300 italic text-sm">Sin novedades</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { logout(); window.location.href = "/"; }}
                            className="flex items-center gap-2 text-red-300 hover:text-red-200 transition-colors text-sm font-medium"
                        >
                            <LogOut size={18} /> <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>

                </div>

                {/* Mobile Nav Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-slate-800 bg-slate-900 absolute w-full left-0 animate-in slide-in-from-top-5">
                        <nav className="flex flex-col p-4 gap-4">
                            <Link
                                to="/vendedor"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg"
                            >
                                <ClipboardList size={20} /> Pedidos
                            </Link>
                            <Link
                                to="/vendedor/ventas"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg"
                            >
                                <ShoppingBag size={20} /> Ventas
                            </Link>
                            <Link
                                to="/vendedor/presupuestador"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg"
                            >
                                <FileText size={20} /> Presupuesto
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
