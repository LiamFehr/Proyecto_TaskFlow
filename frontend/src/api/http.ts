import axios from "axios";

export const http = axios.create({
    baseURL: "/api",
    timeout: 10000,
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("API Error:", err.response?.data);
        return Promise.reject(err);
    }
);
