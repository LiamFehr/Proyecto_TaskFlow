import { http } from "../utils/request";

export const authApi = {
    login: (email, password) =>
        http.post("/auth/login", { email, password }),

    registro: (nombre, email, password) =>
        http.post("/auth/registro", { nombre, email, password }),

    recuperar: (email) =>
        http.post("/auth/recuperar", { email }),

    recuperarConfirmar: (token, nuevaPassword) =>
        http.post("/auth/recuperar/confirmar", { token, nuevaPassword }),

    enviar2FA: (email) =>
        http.post("/auth/2fa/enviar", { email }),

    validar2FA: (email, codigo) =>
        http.post("/auth/2fa/validar", { email, codigo }),
};
