export const apiBase = "/api"; // Relative path for Nginx proxy

export async function request(method, url, body = null, token = null) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(apiBase + url, options);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error en la solicitud");
    }

    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await res.json();
    }
    return await res.text();
}

export const http = {
    get: (url, token) => request("GET", url, null, token),
    post: (url, body, token) => request("POST", url, body, token),
    patch: (url, body, token) => request("PATCH", url, body, token),
    del: (url, token) => request("DELETE", url, null, token),
};
