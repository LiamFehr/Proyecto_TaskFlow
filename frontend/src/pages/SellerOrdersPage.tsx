import { useState, useEffect } from "react";
import axios from "axios";
import { Download, RefreshCw, FileJson, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            console.log("Fetching orders...");
            const response = await axios.get("http://localhost:8000/api/pedidos");
            console.log("Orders fetched:", response.data);
            setOrders(response.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!window.confirm(`¿Estás seguro de eliminar el pedido ${filename}?`)) return;

        try {
            await axios.delete(`http://localhost:8000/api/pedidos/${filename}`);
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("Error al eliminar el pedido");
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/vhp-logo.jpg" alt="VHP Logo" className="h-12 w-auto object-contain" />
                            <span className="font-bold text-xl text-gray-800">Panel Vendedor</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                Actualizado: {lastUpdated.toLocaleTimeString()}
                            </span>
                            <button
                                onClick={fetchOrders}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Pedidos Pendientes</h1>

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow p-12 text-center">
                            <FileJson className="mx-auto text-gray-300 mb-4" size={64} />
                            <h2 className="text-xl font-semibold text-gray-700">No hay pedidos pendientes</h2>
                            <p className="text-gray-500 mt-2">Los nuevos pedidos aparecerán aquí automáticamente.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-600">Cliente</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-600">Archivo</th>
                                        <th className="text-right py-4 px-6 font-semibold text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((filename) => {
                                        const clientName = filename.replace(".json", "").replace(/_/g, " ");
                                        return (
                                            <tr key={filename} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-medium text-gray-900">{clientName}</div>
                                                </td>
                                                <td className="py-4 px-6 text-gray-500 font-mono text-sm">
                                                    {filename}
                                                </td>
                                                <td className="py-4 px-6 text-right flex justify-end gap-2">
                                                    <a
                                                        href={`http://localhost:8000/api/pedidos/${filename}/descargar`}
                                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                        title="Descargar JSON"
                                                        download
                                                    >
                                                        <Download size={16} />
                                                        JSON
                                                    </a>
                                                    <a
                                                        href={`http://localhost:8000/api/pedidos/${filename}/descargar-txt`}
                                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                        title="Descargar TXT"
                                                        download
                                                    >
                                                        <FileText size={16} />
                                                        TXT
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(filename)}
                                                        className="inline-flex items-center justify-center bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
