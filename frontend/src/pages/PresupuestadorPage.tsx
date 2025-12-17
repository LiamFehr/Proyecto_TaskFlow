import { useState } from "react";
import { usePresupuestoStore } from "../store/presupuestoStore";

import { Search, Trash2, FileText, Plus, Package, AlertCircle, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { presupuestoApi } from "../api/presupuestoApi";
import { http } from "../utils/request";

export default function PresupuestadorPage() {
    const {
        items, addItem, removeItem, updateQuantity,
        clientName, clientPhone, observations, dniCuit, condicionIva, ciudad, provincia, filename,
        setClientInfo
    } = usePresupuestoStore();

    // Search State matching VendedorBuscador
    const [query, setQuery] = useState("");
    const [resultados, setResultados] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { token } = useAuthStore(); // Assuming useAuthStore exists and has token

    const buscarProductos = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            // Re-using the logic from VendedorBuscador, but we can use the http helper or the api
            const res = await http.get(`/vendedor/productos?search=${query}`, token);
            setResultados(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error(err);
            setResultados([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = (product: any) => {
        addItem({
            productId: product.id,
            description: product.description,
            price: product.price,
            quantity: 1
        });
    };

    // Manual Item State
    const [manualDesc, setManualDesc] = useState("");
    const [manualPrice, setManualPrice] = useState("");
    const [manualQty, setManualQty] = useState("1");

    // UI State
    const [loadingPdf, setLoadingPdf] = useState(false);

    const addManualItem = () => {
        if (manualDesc && manualPrice) {
            addItem({
                description: manualDesc,
                price: Number(manualPrice),
                quantity: Number(manualQty) || 1
            });
            setManualDesc("");
            setManualPrice("");
            setManualQty("1");
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setLoadingPdf(true);
            const dto = {
                clienteNombre: clientName,
                clienteTelefono: clientPhone,
                observaciones: observations, // Addresses
                dniCuit,
                condicionIva,
                ciudad,
                provincia,
                items: items.map(i => ({
                    productId: i.productId,
                    description: i.description,
                    price: i.price,
                    quantity: i.quantity
                }))
            };

            // Trigger download
            await presupuestoApi.downloadPdf(dto, filename);

        } catch (err) {
            console.error("Error PDF", err);
            alert("Error al generar PDF");
        } finally {
            setLoadingPdf(false);
        }
    };

    const total = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Presupuesto
            </h1>

            {/* Client Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-4">Datos del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            value={clientName}
                            onChange={(e) => setClientInfo(e.target.value, clientPhone, observations, dniCuit, condicionIva, ciudad, provincia, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Teléfono</label>
                        <input
                            type="text"
                            placeholder="Teléfono"
                            value={clientPhone}
                            onChange={(e) => setClientInfo(clientName, e.target.value, observations, dniCuit, condicionIva, ciudad, provincia, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">DNI / CUIT</label>
                        <input
                            type="text"
                            placeholder="DNI / CUIT"
                            value={dniCuit}
                            onChange={(e) => setClientInfo(clientName, clientPhone, observations, e.target.value, condicionIva, ciudad, provincia, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Condición IVA</label>
                        <select
                            value={condicionIva}
                            onChange={(e) => setClientInfo(clientName, clientPhone, observations, dniCuit, e.target.value, ciudad, provincia, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="Consumidor Final">Consumidor Final</option>
                            <option value="Responsable Inscripto">Responsable Inscripto</option>
                            <option value="Monotributista">Monotributista</option>
                            <option value="Exento">Exento</option>
                            <option value="No Responsable">No Responsable</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Dirección</label>
                        <input
                            type="text"
                            placeholder="Dirección (Calle, Altura)"
                            value={observations}
                            onChange={(e) => setClientInfo(clientName, clientPhone, e.target.value, dniCuit, condicionIva, ciudad, provincia, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Ciudad</label>
                        <input
                            type="text"
                            placeholder="Ciudad"
                            value={ciudad}
                            onChange={(e) => setClientInfo(clientName, clientPhone, observations, dniCuit, condicionIva, e.target.value, provincia, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Provincia</label>
                        <input
                            type="text"
                            placeholder="Provincia"
                            value={provincia}
                            onChange={(e) => setClientInfo(clientName, clientPhone, observations, dniCuit, condicionIva, ciudad, e.target.value, filename)}
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Entry - Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* 2. Catálogo Search (Compact Sidebar Version) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:col-span-12">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                                <Search className="w-5 h-5 text-blue-600" />
                                Catálogo
                            </h3>
                            <p className="text-slate-500 text-xs">Busca y agrega productos.</p>
                        </div>

                        <form onSubmit={buscarProductos} className="flex flex-col gap-3 mb-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Código o descripción..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {loading ? "Buscando..." : "Buscar"}
                            </button>
                        </form>

                        {/* Compact Results List */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden min-h-[150px] max-h-[400px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                    <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-2" />
                                    <p className="text-xs">Buscando...</p>
                                </div>
                            ) : resultados.length > 0 ? (
                                <div className="space-y-2">
                                    {resultados.map((p) => (
                                        <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 transition-colors flex justify-between items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {p.code}
                                                    </span>
                                                    {p.hidden && (
                                                        <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                                                            <EyeOff className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-slate-800 truncate" title={p.description}>
                                                    {p.description}
                                                </p>
                                                <p className="text-emerald-700 font-bold text-sm">
                                                    ${p.price.toLocaleString('es-AR')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAddProduct(p)}
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                                                title="Agregar"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : hasSearched ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                    <AlertCircle className="w-8 h-8 mb-2 text-slate-300" />
                                    <p className="text-xs">Sin resultados</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                    <Package className="w-8 h-8 mb-2 text-slate-300" />
                                    <p className="text-xs text-center px-4">Ingresa código o nombre para buscar</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Manual Entry */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Plus size={18} /> Item Manual
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Descripción (ej: Instalación)"
                                value={manualDesc}
                                onChange={(e) => setManualDesc(e.target.value)}
                                className="w-full bg-gray-50 border rounded-lg px-3 py-2"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Precio"
                                    value={manualPrice}
                                    onChange={(e) => setManualPrice(e.target.value)}
                                    className="flex-1 bg-gray-50 border rounded-lg px-3 py-2"
                                />
                                <input
                                    type="number"
                                    placeholder="Cant"
                                    value={manualQty}
                                    onChange={(e) => setManualQty(e.target.value)}
                                    className="w-20 bg-gray-50 border rounded-lg px-3 py-2"
                                />
                            </div>
                            <button
                                onClick={addManualItem}
                                className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700"
                            >
                                Agregar Manual
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items List - Right Column */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Detalle del Presupuesto</h3>
                        <span className="text-2xl font-bold text-blue-600">Total: ${total.toLocaleString()}</span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Agrega productos para armar el presupuesto</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="text-left text-sm text-gray-500 border-b">
                                    <tr>
                                        <th className="pb-3 pl-2">Cant</th>
                                        <th className="pb-3">Descripción</th>
                                        <th className="pb-3 text-right">Unitario</th>
                                        <th className="pb-3 text-right">Subtotal</th>
                                        <th className="pb-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-gray-50">
                                            <td className="py-3 pl-2 font-medium">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (val > 0) updateQuantity(item.id, val);
                                                    }}
                                                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="py-3 text-gray-700">{item.description}</td>
                                            <td className="py-3 text-right text-gray-600">${item.price.toLocaleString()}</td>
                                            <td className="py-3 text-right font-medium">${(item.price * item.quantity).toLocaleString()}</td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                                                    title="Eliminar Item"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between sticky bottom-0">
                        <div className="flex-1 max-w-sm mr-4">
                            <label className="text-xs font-semibold text-gray-500 ml-1 mb-1 block">Nombre del Archivo (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ej: Presupuesto_JuanPerez"
                                value={filename}
                                onChange={(e) => setClientInfo(clientName, clientPhone, observations, dniCuit, condicionIva, ciudad, provincia, e.target.value)}
                                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleDownloadPdf}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                            disabled={items.length === 0 || loadingPdf}
                        >
                            {loadingPdf ? "Generando..." : "Descargar PDF"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
