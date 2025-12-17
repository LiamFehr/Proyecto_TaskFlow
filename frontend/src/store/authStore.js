import { create } from "zustand";

export const useAuthStore = create((set) => ({
    token: null,
    email: null,
    rol: null,
    isAuthenticated: false,

    cargarSesion: () => {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("email");
        const rol = localStorage.getItem("rol");

        if (token) {
            set({
                token,
                email,
                rol,
                isAuthenticated: true,
            });
        }
    },

    setToken: (token) => set({ token }),

    login: (token, email, rol) => {
        localStorage.setItem("token", token);
        localStorage.setItem("email", email);
        localStorage.setItem("rol", rol);

        set({
            token,
            email,
            rol,
            isAuthenticated: true,
        });
    },

    logout: () => {
        localStorage.clear();
        set({
            token: null,
            email: null,
            rol: null,
            isAuthenticated: false,
        });
    },
}));
