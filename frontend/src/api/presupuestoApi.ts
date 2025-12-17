import axios from "axios";

// Helper to get raw blobs (since our request wrapper handles JSON by default)
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const presupuestoApi = {
    downloadPdf: async (data: any, customFilename?: string) => {
        const token = localStorage.getItem("token");
        const response = await axios.post(`${API_URL}/presupuestos/pdf`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            responseType: "blob",
        });

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fn = customFilename ? `${customFilename}.pdf` : `Presupuesto_${data.clienteNombre || 'Cliente'}.pdf`;
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};
