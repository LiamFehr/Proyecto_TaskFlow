import { Outlet, Link } from "react-router-dom";
import { Database, ShoppingBag, Search, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function AdminLayout() {
    const logout = useAuthStore(s => s.logout);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-slate-900 text-white shadow-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <span className="font-bold text-xl">TaskFlow Admin</span>
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
        </div>
    );
}
