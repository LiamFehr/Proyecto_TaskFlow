import { useEffect, useState } from "react";
import { vendedorApi } from "../api/vendedorApi";
import { useAuthStore } from "../store/authStore";

export default function VendedorPedidos() {
    const token = useAuthStore().token;
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        vendedorApi.listarPedidos(token).then(setPedidos);
    }, []);

    return (
        <div>
            <h2>Pedidos Pendientes</h2>
            <pre>{JSON.stringify(pedidos, null, 2)}</pre>
        </div>
    );
}
