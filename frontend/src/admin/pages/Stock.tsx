import { useState, useEffect } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiBase } from '../../utils/request';

const Stock = () => {
    const token = useAuthStore((state) => state.token);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchStock();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm]);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/admin/productos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Backend returns List<Product> (array)
                const productList = Array.isArray(data) ? data : [];

                // Apply search filter
                const filtered = productList.filter(p => {
                    if (!searchTerm) return true;
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        p.code?.toLowerCase().includes(searchLower) ||
                        p.description?.toLowerCase().includes(searchLower) ||
                        p.marca?.toLowerCase().includes(searchLower) ||
                        p.proveedor?.toLowerCase().includes(searchLower)
                    );
                });

                setTotalElements(filtered.length);
                setTotalPages(Math.ceil(filtered.length / pageSize));

                // Slice for current page
                const startIdx = page * pageSize;
                const endIdx = startIdx + pageSize;
                setProducts(filtered.slice(startIdx, endIdx));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Gestión de Stock</h1>
                    <p className="text-slate-500 text-sm">Visualización de inventario ({totalElements} items)</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors">
                    <Download size={18} />
                    <span>Exportar Todo</span>
                </button>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por código, descripción, marca o fábrica..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <select className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none">
                        <option value="">Todas las Marcas</option>
                        {/* Future: Dynamic brands */}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Código</th>
                                <th className="px-6 py-4 font-medium">Descripción</th>
                                <th className="px-6 py-4 font-medium">Marca</th>
                                <th className="px-6 py-4 font-medium">Fábrica (Prov.)</th>
                                <th className="px-6 py-4 font-medium text-right">Stock</th>
                                <th className="px-6 py-4 font-medium text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando inventario...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No se encontraron productos</td></tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 font-medium font-mono">{product.code}</td>
                                        <td className="px-6 py-4 text-slate-400">{product.description}</td>
                                        <td className="px-6 py-4 text-slate-500">{product.marca || '-'}</td>
                                        <td className="px-6 py-4 text-slate-500">{product.proveedor || '-'}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${product.stock <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {product.stock}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 text-right font-mono">
                                            $ {product.price?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
                    <div>
                        Página {page + 1} de {totalPages || 1}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stock;
