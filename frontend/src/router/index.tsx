import { createBrowserRouter } from "react-router-dom";
import SearchPage from "../pages/SearchPage";
import CartPage from "../pages/CartPage";

export const router = createBrowserRouter([
    { path: "/", element: <SearchPage /> },
    { path: "/cart", element: <CartPage /> },
]);
