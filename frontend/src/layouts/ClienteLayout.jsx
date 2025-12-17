import { Outlet, Link } from "react-router-dom";
import { LayoutDashboard, LogIn, UserPlus, ShoppingCart, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function ClienteLayout() {
    const { isAuthenticated, logout, email, rol } = useAuthStore();
    const items = useCartStore((state) => state.items);
    const itemCount = items.reduce((acc, item) => acc + item.qty, 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/">
                            <img src="/assets/images/logo_navidad.png" alt="VHP Logo" className="h-28 w-auto object-contain" />
                        </Link>
                    </div>
                    <nav className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                                    Hola, {email?.split("@")[0]}
                                </span>
                                {(rol === "ADMIN" || rol === "VENDEDOR") && (
                                    <Link
                                        to={rol === "ADMIN" ? "/admin" : "/vendedor"}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden sm:inline">Panel</span>
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        logout();
                                        window.location.href = "/";
                                    }}
                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                                    <LogIn className="h-4 w-4" />
                                    <span className="hidden sm:inline">Iniciar Sesión</span>
                                </Link>
                                <Link to="/registro" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1 shadow-sm hover:shadow-md">
                                    <UserPlus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Registrarse</span>
                                </Link>
                            </>
                        )}

                        <div className="relative">
                            {isAuthenticated ? (
                                <Link to="/cart" className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-all relative block" title="Ver Carrito">
                                    <ShoppingCart className="h-5 w-5" />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                                            {itemCount}
                                        </span>
                                    )}
                                </Link>
                            ) : (
                                <Link to="/login" className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-full transition-all relative block" title="Iniciar Sesión para ver Carrito">
                                    <ShoppingCart className="h-5 w-5" />
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            </header>
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} TaskFlow. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}
