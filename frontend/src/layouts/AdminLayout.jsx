import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Database, ShoppingBag, Search, LogOut, Calculator } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import CalculatorModal from "../components/CalculatorModal";

export default function AdminLayout() {
    const logout = useAuthStore(s => s.logout);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-slate-900 text-white shadow-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/assets/images/logo_navidad.png" alt="VHP" className="h-14 w-auto bg-white rounded-full p-1" />
                            <span className="font-bold text-xl hidden md:block">Admin</span>
                        </Link>
                        <nav className="flex items-center gap-4">
                            <Link to="/admin" className="flex items-center gap-2 hover:text-blue-300 transition-colors">
                                <Database size={18} />
                                Importar CSV
                            </Link>
                            <Link to="/admin/pedidos" className="flex items-center gap-2 hover:text-blue-300 transition-colors">
                                <ShoppingBag size={18} />
                                Pedidos
                            </Link>
                            <Link to="/admin/buscar" className="flex items-center gap-2 hover:text-blue-300 transition-colors">
                                <Search size={18} />
                                Buscador
                            </Link>
                            {/* Calculator Button */}
                            <button
                                onClick={() => setIsCalculatorOpen(true)}
                                className="flex items-center gap-2 hover:text-blue-300 transition-colors"
                                title="Calculadora Rápida"
                            >
                                <Calculator size={18} />
                            </button>
                            {/* Backup Button */}
                            <button
                                onClick={() => window.location.href = 'http://localhost:8000/api/admin/backup'}
                                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/30 px-3 py-1 rounded-lg"
                                title="Descargar Copia de Seguridad"
                            >
                                <Database size={16} />
                                <span className="text-xs font-bold">BACKUP</span>
                            </button>
                        </nav>
                    </div>
                    <button
                        onClick={() => { logout(); window.location.href = "/"; }}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={18} />
                        Salir
                    </button>
                </div>
            </header>
            <main className="p-6">
                <Outlet />
            </main>

            <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        </div>
    );
}
