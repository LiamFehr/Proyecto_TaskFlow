import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import { Lock, Mail, Loader2, ArrowRight, Home } from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const loginStore = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await authApi.login(email, password);

            // If backend indicates 2FA is needed (placeholder logic, adjust if backend sends specific flag)
            // For now, standard login flow
            loginStore.login(data.token, data.email, data.rol);
            navigate(data.rol === "ADMIN" ? "/admin" : data.rol === "VENDEDOR" ? "/vendedor/buscar" : "/");
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al iniciar sesión");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 relative">

            {/* Back to Home Button */}
            <Link to="/" className="absolute top-4 left-4 md:top-8 md:left-8 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600 transition-all hover:scale-105 group flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Home size={20} />
                </div>
                <span className="font-medium pr-2 hidden md:inline">Volver al Inicio</span>
            </Link>

            {/* Main Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Bienvenido</h1>
                    <p className="text-blue-100">Inicia sesión en TaskFlow</p>
                </div>

                <div className="p-8">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center justify-center gap-2">
                            <span>•</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                                <Link to="/recuperar" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center">
                                    Entrar
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            ¿No tienes cuenta?{" "}
                            <Link to="/registro" className="text-blue-600 font-medium hover:underline">
                                Regístrate
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
