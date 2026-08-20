import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { http, apiBase } from '../utils/request';
import { Clock, User, Search, Package, Calculator, Trash2, Plus, X, AlertCircle, ShoppingCart, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import PaymentOptionsDisplay from '../components/PaymentOptionsDisplay';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';

interface Product {
    id: number;
    code: string;
    description: string;
    price: number;
    stock?: number;
}

interface CartItem extends Product {
    quantity: number | '';
}

interface Order {
    id: number;
    numeroOrden?: string;
    clienteNombre?: string;
    cliente?: string;
    vendedorNombre?: string;
    fechaCreacion: string;
    cajeroAtendiendo?: string;
    estado?: string;
    items?: any[];
    total?: number;
}

export default function VendedorPedidosPage() {
    const token = useAuthStore((state) => state.token);
    const [queue, setQueue] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModifying, setIsModifying] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [calcQuantity, setCalcQuantity] = useState(1);
    const [modifiedCart, setModifiedCart] = useState<CartItem[]>([]);

    const fetchQueue = async () => {
        try {
            const res = await fetch(`${apiBase}/pedidos/cola?estado=EN_COLA`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQueue(Array.isArray(data) ? data : []);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error('Error fetching queue:', error);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const buscarProductos = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        setLoadingSearch(true);
        setHasSearched(true);
        try {
            const res = await http.get(`/vendedor/productos?search=${query}`, token);
            setResults(Array.isArray(res) ? res : []);
        } catch (err) {
            setResults([]);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSelectOrder = (order: Order) => {
        if (order.cajeroAtendiendo) {
            alert('Este pedido ya está siendo atendido.');
            return;
        }
        setSelectedOrder(order);
        setIsModifying(false);
        setModifiedCart([]);
        setQuery('');
        setResults([]);
        setHasSearched(false);
    };

    const startModifying = () => {
        if (!selectedOrder?.items) return;
        const cartItems: CartItem[] = selectedOrder.items.map((item: any) => ({
            id: item.productoId || Date.now(),
            code: item.codigo || 'MANUAL',
            description: item.descripcion,
            price: item.precio ?? item.precioUnitario ?? 0,
            quantity: item.cantidad,
            stock: 9999,
        }));
        setModifiedCart(cartItems);
        setIsModifying(true);
    };

    const addToModifiedCart = (product: Product) => {
        setModifiedCart((prev) => {
            const exists = prev.find((i) => i.code === product.code);
            if (exists) return prev.map((i) => i.code === product.code ? { ...i, quantity: (i.quantity === '' ? 0 : i.quantity) + 1 } : i);
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromModifiedCart = (code: string) => setModifiedCart((prev) => prev.filter((i) => i.code !== code));

    const updateModifiedQuantity = (code: string, val: string) => {
        if (val === '') { setModifiedCart(prev => prev.map(i => i.code === code ? { ...i, quantity: '' } : i)); return; }
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) setModifiedCart((prev) => prev.map((i) => i.code === code ? { ...i, quantity: num } : i));
    };

    const getQty = (q: number | '') => (q === '' ? 0 : q);

    const saveModifiedOrder = async () => {
        if (!selectedOrder || modifiedCart.length === 0) { alert('No hay items'); return; }
        if (!window.confirm('¿Guardar cambios? Se reemplazará el pedido original.')) return;
        try {
            await http.del(`/pedidos/${selectedOrder.id}`, token);
            const total = modifiedCart.reduce((acc, i) => acc + i.price * getQty(i.quantity), 0);
            await http.post('/pedidos', {
                clienteNombre: selectedOrder.clienteNombre || selectedOrder.cliente || 'Cliente',
                vendedorNombre: selectedOrder.vendedorNombre || 'Vendedor',
                items: modifiedCart.map(i => ({ codigo: i.code, descripcion: i.description, cantidad: getQty(i.quantity), precio: i.price })),
                total,
            }, token);
            setSelectedOrder(null);
            setIsModifying(false);
            setModifiedCart([]);
            fetchQueue();
        } catch (err) {
            alert('Error al guardar los cambios');
        }
    };

    const deleteOrder = async () => {
        if (!selectedOrder) return;
        if (!window.confirm('¿Eliminar este pedido?')) return;
        try {
            await http.del(`/pedidos/${selectedOrder.id}`, token);
            setSelectedOrder(null);
            fetchQueue();
            toast.success('Pedido eliminado');
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const limpiarCola = async () => {
        if (!window.confirm('¿ELIMINAR TODOS los pedidos pendientes? Esta acción no se puede deshacer.')) return;
        try {
            await http.del('/pedidos/limpiar-cola', token);
            fetchQueue();
            toast.success('Cola de pedidos vaciada');
        } catch (err) {
            alert('Error al limpiar la cola');
        }
    };

    const reenviarPedido = async () => {
        if (!selectedOrder) return;
        try {
            await http.post(`/pedidos/${selectedOrder.id}/reenviar`, {}, token);
            toast.success('Pedido re-enviado al ERP');
        } catch (err) {
            alert('Error al reenviar');
        }
    };

    const modifiedTotal = modifiedCart.reduce((acc, i) => acc + i.price * getQty(i.quantity), 0);

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (diff < 1) return 'ahora';
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#f4f5f7]">

            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-2 sm:py-3 md:py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">Cola de Pedidos</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Actualizado {lastRefresh.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${queue.length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        <span className={`w-2 h-2 rounded-full ${queue.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                        {queue.length} en espera
                    </span>
                    <button onClick={limpiarCola} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] md:text-xs font-black uppercase hover:bg-red-100 transition-all shrink-0">
                        <Trash2 size={14} /> <span className="hidden xs:inline">Borrar todo</span>
                    </button>
                    <button onClick={fetchQueue} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0">
                        <RefreshCw size={16} />
                    </button>
                    <NotificationBell role="VENDEDOR" />
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Order List — full screen on mobile, sidebar on md+ when detail is open */}
                <div className={`flex-col border-r border-gray-200 bg-white transition-all
                    ${selectedOrder ? 'hidden md:flex md:w-[420px] md:shrink-0' : 'flex flex-1'}`}>
                    {/* Column Header */}
                    <div className="px-4 md:px-6 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Turno</span>
                        <span className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest flex-1 ml-3">Cliente</span>
                        <span className="hidden md:block text-[11px] font-black text-gray-400 uppercase tracking-widest">Items</span>
                        <span className="hidden md:block text-[11px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                        <span className="hidden md:block text-[11px] font-black text-gray-400 uppercase tracking-widest">Tiempo</span>
                        <span className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-3">Estado</span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {queue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                <Package size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sin pedidos en espera</p>
                                <p className="text-xs text-gray-300 mt-1">Se actualiza automáticamente</p>
                            </div>
                        ) : (
                            queue.map((order) => {
                                const isSelected = selectedOrder?.id === order.id;
                                const isBusy = !!order.cajeroAtendiendo;
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => handleSelectOrder(order)}
                                        className={`flex items-center px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-gray-50 cursor-pointer transition-all group
                                            ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
                                            ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="font-mono font-black text-blue-600 text-base md:text-lg w-10 shrink-0">
                                            {order.numeroOrden ?? String(order.id).slice(-2).padStart(2, '0')}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-800 flex-1 mx-3 truncate md:whitespace-normal md:overflow-visible">
                                            {order.clienteNombre || order.cliente || 'Consumidor Final'}
                                        </span>
                                        <span className="hidden md:block text-xs text-gray-400 w-8 text-center">
                                            {order.items?.length ?? '—'}
                                        </span>
                                        <span className="hidden md:block text-sm font-bold text-gray-700 w-20 text-right">
                                            {order.total != null ? `$${order.total.toLocaleString('es-AR')}` : '—'}
                                        </span>
                                        <span className="hidden md:block text-xs text-gray-400 w-14 text-center">
                                            {order.fechaCreacion ? timeAgo(order.fechaCreacion) : '—'}
                                        </span>
                                        <span className={`shrink-0 text-center text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide
                                            ${isBusy ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {isBusy ? 'Ocup.' : 'Libre'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Detail Panel — full screen on mobile */}
                {selectedOrder && (
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* Back button — mobile only */}
                        <button
                            onClick={() => { setSelectedOrder(null); setIsModifying(false); setModifiedCart([]); }}
                            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-200 text-blue-700 text-sm font-bold shrink-0">
                            <ArrowLeft size={16} /> Volver a Cola
                        </button>

                        {/* Detail Header */}
                        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2 md:py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-2xl text-blue-600">
                                            #{selectedOrder.numeroOrden ?? selectedOrder.id}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-md uppercase">EN COLA</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                        <User size={12} />
                                        {selectedOrder.clienteNombre || selectedOrder.cliente || 'Consumidor Final'}
                                        {selectedOrder.vendedorNombre && ` · ${selectedOrder.vendedorNombre}`}
                                        {selectedOrder.fechaCreacion && ` · ${new Date(selectedOrder.fechaCreacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedOrder(null); setIsModifying(false); setModifiedCart([]); }}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                            {/* Items Section */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Items Table Header */}
                                <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-6 py-2 grid grid-cols-8 md:grid-cols-12 gap-2">
                                    <span className="hidden md:block md:col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cód.</span>
                                    <span className="col-span-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</span>
                                    <span className="col-span-1 md:col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cant.</span>
                                    <span className="hidden md:block md:col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unitario</span>
                                    <span className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Sub.</span>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {isModifying ? (
                                        modifiedCart.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                                <ShoppingCart size={48} strokeWidth={1} className="mb-3" />
                                                <p className="text-sm text-gray-400 font-medium">Carrito vacío</p>
                                            </div>
                                        ) : (
                                            modifiedCart.map((item, idx) => (
                                                <div key={`${item.code}-${idx}`} className="grid grid-cols-8 md:grid-cols-12 gap-2 px-4 md:px-6 py-2 md:py-3 border-b border-gray-50 hover:bg-blue-50/30 group items-center">
                                                    <span className="hidden md:block md:col-span-1 font-mono text-xs text-gray-400 truncate">{item.code}</span>
                                                    <span className="col-span-5 text-sm font-medium text-gray-800 break-words line-clamp-3 md:line-clamp-none">{item.description}</span>
                                                    <div className="col-span-1 md:col-span-2 flex justify-center">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateModifiedQuantity(item.code, e.target.value)}
                                                            className="w-12 md:w-16 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                        />
                                                    </div>
                                                    <span className="hidden md:block md:col-span-2 text-sm text-gray-500 text-right">${item.price.toLocaleString('es-AR')}</span>
                                                    <div className="col-span-2 flex items-center justify-end gap-1">
                                                        <span className="text-xs md:text-sm font-bold text-gray-800">${(item.price * getQty(item.quantity)).toLocaleString('es-AR')}</span>
                                                        <button onClick={() => removeFromModifiedCart(item.code)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item: any, idx: number) => {
                                                const precio = item.precio ?? item.precioUnitario ?? 0;
                                                return (
                                                    <div key={idx} className="grid grid-cols-8 md:grid-cols-12 gap-2 px-4 md:px-6 py-2 md:py-3 border-b border-gray-50 hover:bg-gray-50 items-center">
                                                        <span className="hidden md:block md:col-span-1 font-mono text-xs text-gray-400 truncate">{item.codigo || '—'}</span>
                                                        <span className="col-span-5 text-sm font-medium text-gray-800 break-words line-clamp-3 md:line-clamp-none">
                                                            {item.descripcion}
                                                        </span>
                                                        <span className="col-span-1 md:col-span-2 text-sm text-gray-600 text-center font-bold">{item.cantidad}</span>
                                                        <span className="hidden md:block md:col-span-2 text-sm text-gray-500 text-right">${precio.toLocaleString('es-AR')}</span>
                                                        <span className="col-span-2 text-sm font-bold text-gray-800 text-right">${(precio * item.cantidad).toLocaleString('es-AR')}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                                <Package size={48} strokeWidth={1} className="mb-3" />
                                                <p className="text-sm text-gray-400">Sin items</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Total Bar */}
                                <div className="border-t border-gray-200 bg-white px-6 py-2 md:py-4 flex items-center justify-between shrink-0">
                                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total</span>
                                    <span className="text-xl md:text-3xl font-black text-gray-900 tabular-nums">
                                        ${(isModifying ? modifiedTotal : (selectedOrder.total ?? 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Right Panel: Search (when modifying) */}
                            {isModifying && (
                                <div className="h-52 md:h-auto md:w-80 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col bg-white md:shrink-0">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agregar Productos</p>
                                    </div>
                                    <form onSubmit={buscarProductos} className="flex gap-2 p-4 border-b border-gray-100">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                            placeholder="Código o nombre..."
                                            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            autoFocus
                                        />
                                        <button type="submit" disabled={loadingSearch || !query.trim()}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all">
                                            <Search size={16} />
                                        </button>
                                    </form>
                                    <div className="flex-1 overflow-y-auto">
                                        {loadingSearch ? (
                                            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
                                        ) : results.map(p => (
                                            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-blue-50 group transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-[10px] text-gray-400">{p.code}</p>
                                                    <p className="text-sm font-medium text-gray-800 truncate">{p.description}</p>
                                                    <p className="text-sm font-bold text-blue-600">${p.price.toLocaleString('es-AR')}</p>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    <button onClick={() => addToModifiedCart(p)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                                                        <Plus size={14} />
                                                    </button>
                                                    <button onClick={() => { setSelectedProduct(p); setCalcQuantity(1); }} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-all">
                                                        <Calculator size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {hasSearched && !loadingSearch && results.length === 0 && (
                                            <div className="flex flex-col items-center py-10 text-gray-300">
                                                <AlertCircle size={32} strokeWidth={1} className="mb-2" />
                                                <p className="text-xs text-gray-400">Sin resultados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                         <div className="bg-white border-t border-gray-200 px-4 md:px-6 py-2 sm:py-3 md:py-4 flex gap-2 md:gap-3 shrink-0">
                             {isModifying ? (
                                 <>
                                     <button onClick={() => { setIsModifying(false); setModifiedCart([]); }}
                                         className="px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">
                                         Cancelar
                                     </button>
                                     <button onClick={saveModifiedOrder} disabled={modifiedCart.length === 0}
                                         className="flex-1 py-2 sm:py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all text-sm flex items-center justify-center gap-2">
                                         <CheckCircle2 size={18} /> <span className="hidden xs:inline">Guardar Cambios</span><span className="xs:hidden">Guardar</span>
                                     </button>
                                 </>
                             ) : (
                                 <>
                                     <button onClick={reenviarPedido}
                                         className="px-3 md:px-6 py-2 sm:py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all text-[10px] md:text-sm flex items-center gap-1.5 md:gap-2 border border-blue-200">
                                         <RefreshCw size={14} /> <span className="whitespace-nowrap">Volver a enviar</span>
                                     </button>
                                     <button onClick={deleteOrder}
                                         className="px-4 md:px-6 py-2 sm:py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all text-sm flex items-center gap-2 border border-red-200">
                                         <Trash2 size={16} /> <span className="hidden sm:inline">Eliminar</span>
                                     </button>
                                     <button onClick={startModifying}
                                         className="flex-1 py-2 sm:py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all text-sm">
                                         Modificar
                                     </button>
                                 </>
                             )}
                         </div>
                    </div>
                )}
            </div>

            {/* Calculator Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Calculator className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{selectedProduct.description}</p>
                                    <p className="text-xs text-gray-400 font-mono">{selectedProduct.code} · ${selectedProduct.price.toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                    <button onClick={() => setCalcQuantity(q => Math.max(1, q - 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xl font-bold transition-colors">−</button>
                                    <span className="w-12 text-center font-black text-lg text-gray-900">{calcQuantity}</span>
                                    <button onClick={() => setCalcQuantity(q => q + 1)}
                                        className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white text-xl font-bold hover:bg-blue-700 transition-colors">+</button>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <PaymentOptionsDisplay price={selectedProduct.price * calcQuantity} showTitle={true} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
