import { createBrowserRouter } from "react-router-dom";
import SearchPage from "../pages/SearchPage";
import CartPage from "../pages/CartPage";
import SellerOrdersPage from "../pages/SellerOrdersPage";

export const router = createBrowserRouter([
    { path: "/", element: <SearchPage /> },
    { path: "/cart", element: <CartPage /> },
    { path: "/vendedor/pedidos", element: <SellerOrdersPage /> },
]);
