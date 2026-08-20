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
        if (res.status === 401) {
            const hadToken = !!localStorage.getItem('token');
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('rol');
            // Only redirect to login if the user had an active session (token expired).
            // Public pages without a token should not be forcefully redirected.
            if (hadToken) {
                window.location.href = '/login';
            }
            throw new Error("Sesión expirada");
        }
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
