import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { ShoppingBag, Search, LogOut, Calculator, FileText, Menu, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import CalculatorModal from "../components/CalculatorModal";

export default function VendedorLayout() {
    const logout = useAuthStore(s => s.logout);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
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
                            <ShoppingBag size={18} /> Pedidos
                        </Link>
                        <Link to="/vendedor/buscar" className="flex items-center gap-2 text-sm font-medium hover:text-blue-300 transition-colors">
                            <Search size={18} /> Buscador
                        </Link>
                        <Link to="/vendedor/presupuestador" className="flex items-center gap-2 text-sm font-medium hover:text-blue-300 transition-colors">
                            <FileText size={18} /> Presupuesto
                        </Link>
                        <button
                            onClick={() => setIsCalculatorOpen(true)}
                            className="flex items-center gap-2 text-sm font-medium hover:text-blue-300 transition-colors"
                        >
                            <Calculator size={18} /> Calculadora
                        </button>
                    </nav>

                    <button
                        onClick={() => { logout(); window.location.href = "/"; }}
                        className="flex items-center gap-2 text-red-300 hover:text-red-200 transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} /> <span className="hidden sm:inline">Salir</span>
                    </button>
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
                                <ShoppingBag size={20} /> Pedidos
                            </Link>
                            <Link
                                to="/vendedor/buscar"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg"
                            >
                                <Search size={20} /> Buscador
                            </Link>
                            <Link
                                to="/vendedor/presupuestador"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg"
                            >
                                <FileText size={20} /> Presupuesto
                            </Link>
                            <button
                                onClick={() => { setIsCalculatorOpen(true); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg w-full text-left"
                            >
                                <Calculator size={20} /> Calculadora
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>

            <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        </div >
    );
}
