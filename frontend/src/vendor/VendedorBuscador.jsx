import { useState } from "react";
import { vendedorApi } from "../api/vendedorApi";
import { useAuthStore } from "../store/authStore";
import { Search, Package, Eye, EyeOff, AlertCircle, X, Calculator } from "lucide-react";
import PaymentOptionsDisplay from "../components/PaymentOptionsDisplay";
import { cn } from "../lib/utils";

export default function VendedorBuscador() {
    const token = useAuthStore().token;
    const [query, setQuery] = useState("");
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Calculator State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const buscar = async (e) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            const res = await vendedorApi.buscarProductos(query, token);
            setResultados(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error(err);
            setResultados([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Search className="w-8 h-8 text-blue-600" />
                            Buscador de Personal
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Búsqueda avanzada y calculadora de precios rápida.
                        </p>
                    </div>

                    <form onSubmit={buscar} className="w-full md:w-auto md:min-w-[400px] flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Código o nombre..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "..." : "Buscar"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p>Buscando coincidencias...</p>
                    </div>
                ) : resultados.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Precio Lista</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resultados.map((p) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => handleProductClick(p)}
                                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-bold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                                {p.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{p.description}</div>
                                            {p.hidden && (
                                                <span className="inline-flex items-center gap-1 mt-1 text-xs text-red-500 font-medium">
                                                    <EyeOff className="w-3 h-3" /> Oculto al público
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-emerald-600 font-bold text-lg">
                                                ${p.price.toLocaleString('es-AR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                                                <Calculator size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : hasSearched ? (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                        <AlertCircle className="w-16 h-16 mb-4 text-slate-200" />
                        <h3 className="text-lg font-medium text-slate-600">No se encontraron productos</h3>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                        <Package className="w-16 h-16 mb-4 text-slate-200" />
                        <h3 className="text-lg font-medium text-slate-600">Listo para buscar</h3>
                    </div>
                )}
            </div>

            {/* Price Calculator Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-blue-400" />
                                Calculadora de Precio
                            </h3>
                            <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Product Info & Quantity */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{selectedProduct.description}</h4>
                                    <p className="text-slate-500 font-mono mt-1">Cód: {selectedProduct.code} - Base: ${selectedProduct.price.toLocaleString('es-AR')}</p>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-8 h-8 rounded-lg bg-white shadow-sm hover:bg-slate-100 font-bold text-lg flex items-center justify-center transition-colors text-slate-600"
                                    >-</button>
                                    <div className="text-center min-w-[3rem]">
                                        <span className="text-xs text-slate-400 font-bold uppercase block">Cant.</span>
                                        <span className="text-lg font-bold text-slate-900">{quantity}</span>
                                    </div>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="w-8 h-8 rounded-lg bg-blue-600 shadow-sm hover:bg-blue-700 font-bold text-lg flex items-center justify-center transition-colors text-white"
                                    >+</button>
                                </div>
                            </div>

                            {/* Payment Options Grid */}
                            <PaymentOptionsDisplay price={selectedProduct.price * quantity} showTitle={true} />

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
