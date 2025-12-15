import { useState } from "react";
import { authApi } from "../api/authApi";
import { Link } from "react-router-dom";
import { Lock, Mail, User, Loader2, ArrowRight, Check, X, AlertCircle, Home } from "lucide-react";

export default function Registro() {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validation Requirements
    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const isPasswordValid = Object.values(validations).every(Boolean);
    const passwordsMatch = password === confirmPassword && password !== "";

    const registrar = async (e) => {
        e.preventDefault();
        setError("");

        if (!isPasswordValid) {
            setError("La contraseña no cumple con los requisitos de seguridad.");
            return;
        }

        if (!passwordsMatch) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            await authApi.registro(nombre, email, password);
            setOk(true);
        } catch (err) {
            setError(err.message || "Error al registrarse. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (ok) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <ArrowRight className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta Creada!</h2>
                    <p className="text-gray-500 mb-8">
                        Tu registro fue exitoso. Ya puedes iniciar sesión.
                    </p>
                    <Link
                        to="/login"
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8 relative">

            {/* Back to Home Button */}
            <Link to="/" className="absolute top-4 left-4 md:top-8 md:left-8 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600 transition-all hover:scale-105 group flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Home size={20} />
                </div>
                <span className="font-medium pr-2 hidden md:inline">Volver al Inicio</span>
            </Link>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
                    <p className="text-blue-100">Únete a TaskFlow con seguridad</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={registrar} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    placeholder="Tu nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
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

                            {/* Password Strength Indicator */}
                            {password.length > 0 && (
                                <div className="mt-2 text-xs space-y-1 pl-1">
                                    <div className={`flex items-center gap-1.5 ${validations.length ? 'text-green-600' : 'text-gray-400'}`}>
                                        {validations.length ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
                                        Mínimo 8 caracteres
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${validations.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                        {validations.uppercase ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
                                        Al menos una mayúscula
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${validations.number ? 'text-green-600' : 'text-gray-400'}`}>
                                        {validations.number ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
                                        Al menos un número
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${validations.special ? 'text-green-600' : 'text-gray-400'}`}>
                                        {validations.special ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
                                        Al menos un carácter especial (!@#$...)
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="password"
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-gray-50 border rounded-xl py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${confirmPassword && !passwordsMatch ? "border-red-300 focus:ring-red-200" : "border-gray-200"
                                        }`}
                                    required
                                />
                                {confirmPassword && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <X className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isPasswordValid || !passwordsMatch}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed pt-4 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center">
                                    Registrarme
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 font-medium cursor-pointer hover:underline">Inicia Sesión</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
