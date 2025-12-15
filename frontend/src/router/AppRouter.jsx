import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../auth/Login";
import Registro from "../auth/Registro";
import RecuperarCuenta from "../auth/RecuperarCuenta";
import Verificacion2FA from "../auth/Verificacion2FA";
import CartPage from "../pages/CartPage";

import ClienteLayout from "../layouts/ClienteLayout";
import VendedorLayout from "../layouts/VendedorLayout";
import AdminLayout from "../layouts/AdminLayout";

import VendedorBuscador from "../vendor/VendedorBuscador";
import SellerOrdersPage from "../pages/SellerOrdersPage";

import ImportarCSV from "../admin/ImportarCSV";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/recuperar" element={<RecuperarCuenta />} />
                <Route path="/2fa" element={<Verificacion2FA />} />

                {/* protected cart */}
                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute>
                            <CartPage />
                        </ProtectedRoute>
                    }
                />

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
                        <ProtectedRoute roles={["VENDEDOR"]}>
                            <VendedorLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<SellerOrdersPage />} />
                    <Route path="buscar" element={<VendedorBuscador />} />
                </Route>

                {/* admin */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute roles={["ADMIN"]}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ImportarCSV />} />
                    <Route path="pedidos" element={<SellerOrdersPage />} />
                    <Route path="buscar" element={<VendedorBuscador />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
