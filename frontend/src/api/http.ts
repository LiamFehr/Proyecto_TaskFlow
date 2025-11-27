import axios from "axios";

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
    timeout: 10000,
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("API Error:", err.response?.data);
        return Promise.reject(err);
    }
);
