import { createBrowserRouter } from "react-router-dom";
import AdminLayout from "../admin/layout/AdminLayout";

// Public Pages
import SearchPage from "../pages/SearchPage";
import CartPage from "../pages/CartPage";
import SellerOrdersPage from "../pages/SellerOrdersPage";
import CajaPage from "../pages/CajaPage";
import RegistrosPage from "../pages/RegistrosPage";
import FilaPage from "../pages/FilaPage";

// Admin Pages
import Dashboard from "../admin/pages/Dashboard";
import Stock from "../admin/pages/Stock";
import Productos from "../admin/pages/Productos";
import Documentos from "../admin/pages/Documentos";

// Auth Pages
import Login from "../auth/Login";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
    { path: "/", element: <SearchPage /> },
    { path: "/login", element: <Login /> }, // Fix: Ruta login agregada
    { path: "/cart", element: <CartPage /> },
    { path: "/vendedor", element: <SellerOrdersPage /> },
    { path: "/vendedor/pedidos", element: <SellerOrdersPage /> },
    { path: "/fila", element: <FilaPage /> },

    // Admin Module
    {
        path: "/admin",
        element: (
            <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Dashboard /> },
            { path: "stock", element: <Stock /> },
            { path: "products", element: <Productos /> },
            { path: "documents", element: <Documentos /> },
            { path: "caja", element: <CajaPage /> },
            { path: "registros", element: <RegistrosPage /> }
        ]
    }
]);
