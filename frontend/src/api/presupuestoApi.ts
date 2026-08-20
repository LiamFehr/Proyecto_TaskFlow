import axios from "axios";
import { http, request } from "../utils/request";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const getToken = () => localStorage.getItem("token");

export const presupuestoApi = {
    // ── CRUD ──────────────────────────────────────────────────────────────
    list: () =>
        http.get("/presupuestos", getToken()),

    get: (id: number) =>
        http.get(`/presupuestos/${id}`, getToken()),

    save: (data: any) =>
        http.post("/presupuestos", data, getToken()),

    update: (id: number, data: any) =>
        request("PUT", `/presupuestos/${id}`, data, getToken() as any),

    delete: (id: number) =>
        http.del(`/presupuestos/${id}`, getToken()),

    toPedido: (id: number) =>
        http.post(`/presupuestos/${id}/to-pedido`, null, getToken()),

    // ── PDF ───────────────────────────────────────────────────────────────
    downloadPdf: async (data: any, customFilename?: string) => {
        const token = getToken();
        const response = await axios.post(`${API_URL}/presupuestos/pdf`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            responseType: "blob",
        });

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fn = customFilename
            ? `${customFilename}.pdf`
            : `Presupuesto_${data.clienteNombre || "Cliente"}.pdf`;
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },
};
