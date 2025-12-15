import "./index.css";

import AppRouter from "./router/AppRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ... imports
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient();

export default function App() {
    const cargarSesion = useAuthStore((state) => state.cargarSesion);

    useEffect(() => {
        cargarSesion();
    }, [cargarSesion]);

    return (
        <QueryClientProvider client={queryClient}>
            <AppRouter />
        </QueryClientProvider>
    );
}
