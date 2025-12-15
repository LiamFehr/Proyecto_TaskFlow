import { http } from "../utils/request";

export const vendedorApi = {
    buscarProductos: (query, token) =>
        http.get(`/vendedor/productos?search=${query}`, token),

    listarPedidos: (token) =>
        http.get("/vendedor/pedidos", token),

    procesarPedido: (id, token) =>
        http.patch(`/vendedor/pedidos/${id}/procesar`, {}, token),
};
