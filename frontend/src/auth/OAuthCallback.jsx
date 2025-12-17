import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const [statusMessage, setStatusMessage] = useState("Iniciando sesión con Google...");
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    // Use explicit selectors to avoid minification/scope issues
    const setToken = useAuthStore((state) => state.setToken);
    const cargarSesion = useAuthStore((state) => state.cargarSesion);

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            // Manual JWT Decode to get Email/Role immediately
            try {
                const base64Url = token.split('.')[1];
                let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                // Pad with '='
                const padding = base64.length % 4;
                if (padding) {
                    base64 += "====".substring(0, 4 - padding);
                }

                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                const email = decoded.sub;
                const rol = decoded.rol;

                // Save to store & localStorage
                login(token, email, rol);
            } catch (e) {
                console.error("Error decoding token:", e);
                // Fallback (saves token only, might miss name)
                localStorage.setItem("token", token);
                setToken(token);
                cargarSesion();
            }

            setStatusMessage("¡Bienvenido! Redirigiendo...");

            // Use a slight delay to show the success message
            const timer = setTimeout(() => {
                navigate("/");
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            console.error("No token received");
            navigate("/login");
        }
    }, [searchParams, navigate, setToken, cargarSesion, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                {statusMessage === "¡Bienvenido! Redirigiendo..." ? (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{statusMessage}</h2>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-700">{statusMessage}</h2>
                    </>
                )}
            </div>
        </div>
    );
}
