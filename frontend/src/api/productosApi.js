import { http } from "../utils/request";

export const productosApi = {
    buscarPorCodigo: (codigo) =>
        http.get(`/api/productos/${codigo}`),

    buscarPorDescripcion: (desc, token) =>
        http.get(`/api/productos/buscar?desc=${desc}`, token),
};
