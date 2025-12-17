import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { Mail, Lock, Key, ArrowRight, CheckCircle, AlertTriangle, Loader2, Copy } from "lucide-react";

export default function RecuperarCuenta() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Email, 2: Token & New Password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form Data
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // URL Params for Magic Link
    const [searchParams] = useSearchParams();

    // Simulated Token (Demo Mode - Deprecated/Hidden)
    const [simulatedToken, setSimulatedToken] = useState(null);

    useEffect(() => {
        const urlToken = searchParams.get("token");
        const urlEmail = searchParams.get("email");

        if (urlToken && urlEmail) {
            setToken(urlToken);
            setEmail(urlEmail); // Optional depending on API needs, but good for context
            setStep(2); // Jump to step 2
        }
    }, [searchParams]);

    const handleSolicitarToken = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // Backend sends the email
            await authApi.recuperar(email);
            setStep(2);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al solicitar código");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmar = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authApi.recuperarConfirmar(token, newPassword);
            alert("¡Contraseña actualizada con éxito!");
            navigate("/login");
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al cambiar la contraseña");
        } finally {
            setLoading(false);
        }
    };

    const copyToken = () => {
        if (simulatedToken) {
            navigator.clipboard.writeText(simulatedToken);
            setToken(simulatedToken); // Auto-fill for convenience
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Recuperar Cuenta</h1>
                    <p className="text-slate-300 text-sm">
                        {step === 1 ? "Ingresa tu email para recibir un código" : "Define tu nueva contraseña"}
                    </p>
                </div>

                <div className="p-8">
                    {/* SIMULATION ALERT: Only show if we got a token back in text format */}


                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    {step === 1 ? (
                        /* STEP 1: EMAIL */
                        <form onSubmit={handleSolicitarToken} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Enviar Código"}
                            </button>
                        </form>
                    ) : (
                        /* STEP 2: TOKEN & PASSWORD */
                        <form onSubmit={handleConfirmar} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">Código de Recuperación</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Pega el código aquí..."
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                        minLength={8}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 ml-1">Mínimo 8 caracteres.</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Cambiar Contraseña"}
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
