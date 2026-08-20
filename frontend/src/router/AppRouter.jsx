import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../auth/Login";
import Registro from "../auth/Registro";
import RecuperarCuenta from "../auth/RecuperarCuenta";
import Verificacion2FA from "../auth/Verificacion2FA";
import OAuthCallback from "../auth/OAuthCallback";
import CartPage from "../pages/CartPage";

import ClienteLayout from "../layouts/ClienteLayout";
import VendedorLayout from "../layouts/VendedorLayout";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";
import PresupuestadorPage from "../pages/PresupuestadorPage";
import VendedorPedidosPage from "../pages/VendedorPedidosPage";
import SellerOrdersPage from "../pages/SellerOrdersPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/recuperar" element={<RecuperarCuenta />} />
                <Route path="/recuperar" element={<RecuperarCuenta />} />
                <Route path="/2fa" element={<Verificacion2FA />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />

                {/* public cart (Self-Service) */}
                <Route path="/cart" element={<CartPage />} />

                {/* cliente */}
                <Route
                    path="/"
                    element={
                        <ClienteLayout />
                    }
                >
                    <Route index element={<SearchPage />} />
                    {/* <Route path="buscar" element={<SearchPage />} /> */}
                </Route>

                {/* vendedor */}
                <Route
                    path="/vendedor"
                    element={
                        <ProtectedRoute roles={["VENDEDOR", "ADMIN"]}>
                            <VendedorLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<VendedorPedidosPage />} />
                    <Route path="ventas" element={<SellerOrdersPage />} />
                    <Route path="presupuestador" element={<PresupuestadorPage />} />
                    <Route path="stock" element={<div>Panel de Stock (Próximamente)</div>} />
                    <Route path="admin" element={<div>Panel de administración (Próximamente)</div>} />
                </Route>

                <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-2xl font-bold">404 - Página no encontrada</div>} />
            </Routes>
        </BrowserRouter>
    );
}
