import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiBase } from '../utils/request';
import { QueueList } from '../components/caja/QueueList';
import { OrderModal } from '../components/caja/OrderModal';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const CajaPage = () => {
    const token = useAuthStore((state) => state.token);
    const [queue, setQueue] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const fetchCola = async () => {
        try {
            const res = await fetch(`${apiBase}/pedidos/cola?estado=EN_COLA`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQueue(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching queue:", error);
        }
    };

    useEffect(() => {
        fetchCola();

        // WebSocket STOMP for real-time updates
        const socketUrl = apiBase.replace('/api', '') + '/ws-next-system';
        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            debug: () => { /* noop */ },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('Caja conectada al WebSocket ERP');
            // Cuando entra un pedido o cambia el estado: fetch
            client.subscribe('/topic/pedidos-entrantes', () => fetchCola());
            client.subscribe('/topic/status-sincro', () => fetchCola());
        };

        client.activate();

        // Fallback polling lento (cada 30 seg) por seguridad
        const interval = setInterval(fetchCola, 30000);

        return () => {
            clearInterval(interval);
            client.deactivate();
        };
    }, [token]);

    const handleSelectOrder = async (order: any) => {
        if (order.cajeroAtendiendo) {
            alert("Este pedido ya está siendo atendido por otro cajero.");
            return;
        }

        try {
            const res = await fetch(`${apiBase}/pedidos/${order.id}/tomar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updatedOrder = await res.json();
                setSelectedOrder(updatedOrder);
                fetchCola(); // Refresh list to show status change if needed (though modal covers it)
            } else {
                alert("No se pudo tomar el pedido. Tal vez ya fue tomado.");
                fetchCola();
            }
        } catch (error) {
            console.error("Error taking order:", error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] p-6 gap-6 text-slate-100">
            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {/* Toolbar */}
                <div className="flex justify-end gap-2 mb-2">
                    <button
                        onClick={() => fetchCola()}
                        className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
                        title="Actualizar"
                    >
                        <span className="sr-only">Actualizar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                    </button>
                    {/* Dev/Recovery Tool: Release All Locks */}
                    <button
                        onClick={async () => {
                            if (!window.confirm("¿Estás seguro de desbloquear pedidos trabados? Esto liberará todos los pedidos en estado 'ATENDIENDO'.")) return;
                            try {
                                const res = await fetch(`${apiBase}/pedidos/cola?estado=ATENDIENDO`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    const locked = await res.json();
                                    if (Array.isArray(locked) && locked.length > 0) {
                                        await Promise.all(locked.map(o =>
                                            fetch(`${apiBase}/pedidos/${o.id}/liberar`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            })
                                        ));
                                        alert(`Se liberaron ${locked.length} pedidos.`);
                                    } else {
                                        alert("No se encontraron pedidos bloqueados.");
                                    }
                                }
                                fetchCola();
                            } catch (e) {
                                console.error(e);
                                alert("Error al intentar liberar pedidos.");
                            }
                        }}
                        className="bg-red-500/10 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors border border-red-500/20"
                        title="Resetear Bloqueos (Emergencia)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12V6" /><path d="M8 8v-2" /><path d="M16 8v-2" /><path d="M4 2v20" /><path d="M20 2v20" /><path d="M12 12a4 4 0 0 1 0 8" /></svg>
                    </button>
                </div>
                <QueueList queue={queue} onSelectOrder={handleSelectOrder} />
            </div>

            {/* Order Modal (Floating Window) */}
            {selectedOrder && (
                <OrderModal
                    order={selectedOrder}
                    onClose={async () => {
                        // Release lock on close if not paid/completed
                        // We check if it is still active/selected
                        try {
                            // Optimistic UI close
                            setSelectedOrder(null);
                            // Fire and forget release to keep UI snappy
                            await fetch(`${apiBase}/pedidos/${selectedOrder.id}/liberar`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                        } catch (e) { console.error("Error releasing order", e); }
                        fetchCola();
                    }}
                    onUpdate={() => {
                        // This is called after payment success, so NO need to release manually
                        // because backend 'cerrarVenta' already clears the lock.
                        setSelectedOrder(null);
                        fetchCola();
                    }}
                />
            )}
        </div>
    );
};

export default CajaPage;
