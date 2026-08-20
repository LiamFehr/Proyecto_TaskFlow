import { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiBase } from '../../utils/request';

const Productos = () => {
    const token = useAuthStore((state) => state.token);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    // Pagination State
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/admin/productos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend returns List<Product> (array)
                const productList = Array.isArray(data) ? data : [];
                setProducts(productList);
                setTotalElements(productList.length);
                setTotalPages(Math.ceil(productList.length / pageSize));
            } else {
                setProducts([]);
                setTotalElements(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const startEdit = useCallback((product: any) => {
        setEditingId(product.id);
        setEditPrice(product.price);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingId(null);
        setEditPrice('');
    }, []);

    const savePrice = useCallback(async (id: number) => {
        try {
            const res = await fetch(`${apiBase}/admin/productos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ price: parseFloat(editPrice) })
            });

            if (res.ok) {
                const updated = await res.json();
                // Optimistic update in current page
                setProducts(products.map(p => p.id === id ? updated : p));
                setEditingId(null);
            } else {
                alert("Error al actualizar precio");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    }, [token, editPrice, products]);

    // Filter logic is now server-side, but we keep this variable for mapping just in case
    // Filter and Paginate Client-Side
    const displayProducts = products
        .filter(p => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                p.code?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                p.marca?.toLowerCase().includes(searchLower)
            );
        })
        .slice(page * pageSize, (page + 1) * pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Productos</h1>
                    <p className="text-slate-500 text-sm">Vista rápida y corrección de precios ({totalElements} items)</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por código..."
                            className="w-full md:w-64 pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400 font-medium">
                            <tr>
                                <th className="p-4">Código</th>
                                <th className="p-4">Marca</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4">Precio Actual</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Cargando productos...</td></tr>
                            ) : displayProducts.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No se encontraron productos</td></tr>
                            ) : (
                                displayProducts
                                    .filter(p => p.description !== 'SECCION' && !p.code.includes(' ')) // Filter out corrupted data
                                    .map(product => (
                                        <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{product.code}</td>
                                            <td className="p-4 text-slate-400">{product.marca || '-'}</td>
                                            <td className="p-4 text-slate-200">{product.description}</td>
                                            <td className="p-4">
                                                {editingId === product.id ? (
                                                    <input
                                                        type="number"
                                                        className="bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-white w-24"
                                                        value={editPrice}
                                                        onChange={(e) => setEditPrice(e.target.value)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-emerald-400">
                                                        $ {product.price?.toLocaleString()}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {editingId === product.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => savePrice(product.id)} className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/40">
                                                            <Save size={16} />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => startEdit(product)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
                    <div>
                        Página {page + 1} de {totalPages}
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
        </div >
    );
};

export default Productos;
