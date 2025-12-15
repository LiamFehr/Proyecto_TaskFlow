import { Outlet, Link } from "react-router-dom";
import { ShoppingBag, Search, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function VendedorLayout() {
    const logout = useAuthStore(s => s.logout);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-800 text-white shadow-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <span className="font-bold text-xl">TaskFlow Vendedor</span>
                        <nav className="flex items-center gap-4">
                            <Link to="/vendedor" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                                <ShoppingBag size={18} />
                                Pedidos
                            </Link>
                            <Link to="/vendedor/buscar" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                                <Search size={18} />
                                Buscador
                            </Link>
                        </nav>
                    </div>
                    <button
                        onClick={() => { logout(); window.location.href = "/"; }}
                        className="flex items-center gap-2 text-red-300 hover:text-red-200 transition-colors"
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
