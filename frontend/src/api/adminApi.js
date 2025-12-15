import { apiBase } from "../utils/request";

export const adminApi = {
    importarCSV: async (file, token) => {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch(apiBase + "/admin/productos/importar", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });

        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    importarJSON: async (products, filename, token) => {
        const res = await fetch(apiBase + `/admin/productos/importar-json?filename=${encodeURIComponent(filename)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(products),
        });

        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    listarImportaciones: (token) =>
        fetch(apiBase + "/admin/importaciones", {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

    verImportacion: (id, token) =>
        fetch(apiBase + `/admin/importaciones/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

    getProductos: (token) =>
        fetch(apiBase + "/admin/productos", {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

    updateProducto: (id, data, token) =>
        fetch(apiBase + `/admin/productos/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        }).then(r => r.json()),

    deleteProducto: (id, token) =>
        fetch(apiBase + `/admin/productos/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
};
