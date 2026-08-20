import { useState, useEffect } from 'react';
import { X, Search, Trash2, Plus, CreditCard, Banknote, Landmark, Printer, Check } from 'lucide-react';
import { apiBase } from '../../utils/request';
import { useAuthStore } from '../../store/authStore';

interface OrderModalProps {
    order: any;
    onClose: () => void;
    onUpdate: () => void;
}

export const OrderModal = ({ order, onClose, onUpdate }: OrderModalProps) => {
    const token = useAuthStore((state) => state.token);
    const [items, setItems] = useState<any[]>(order.items || []);
    const [, setPaymentMethod] = useState<string | null>(null);
    const [cashOpen, setCashOpen] = useState(false);
    const [cashAmount, setCashAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    // New State for Modals & Features
    const [showSearch, setShowSearch] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastChange, setLastChange] = useState(0);

    // Search Logic
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Manual Logic
    const [manualItem, setManualItem] = useState({ desc: '', price: '', qty: '1' });

    // Derived state for total
    const total = items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);

    // Sync items when order changes
    useEffect(() => {
        setItems(order.items || []);
    }, [order]);

    // NEW: Server-Side Search
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setProducts([]);
            return;
        }

        try {
            // Use VendedorController endpoint for search (supports brand/marca)
            const res = await fetch(`${apiBase}/vendedor/productos?search=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // VendedorController returns raw list, but we check just in case
                const list = Array.isArray(data) ? data : [];
                setProducts(list);
            }
        } catch (e) {
            console.error("Error searching products", e);
            setProducts([]);
        }
    };

    // Removed generic fetchProducts effect to optimize performance

    const handleUpdateItem = (index: number, delta: number) => {
        const newItems = [...items];
        newItems[index].cantidad += delta;
        if (newItems[index].cantidad <= 0) {
            newItems.splice(index, 1);
        }
        setItems(newItems);
        saveOrderChanges(newItems);
    };

    const handlePriceEdit = (index: number, newPrice: string) => {
        const price = parseFloat(newPrice);
        if (isNaN(price)) return;
        const newItems = [...items];
        newItems[index].precioUnitario = price;
        setItems(newItems);
        saveOrderChanges(newItems);
    };

    const handleAddProduct = (product: any) => {
        const newItems = [...items];
        // Check if exists
        const exists = newItems.find(i => i.codigo === product.code);
        if (exists) {
            exists.cantidad += 1;
        } else {
            newItems.push({
                codigo: product.code,
                descripcion: product.description,
                cantidad: 1,
                precioUnitario: product.price
            });
        }
        setItems(newItems);
        saveOrderChanges(newItems);
        setShowSearch(false);
    };

    const handleAddManual = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(manualItem.price);
        const qty = parseInt(manualItem.qty);
        if (!manualItem.desc || isNaN(price) || isNaN(qty)) return;

        const newItems = [...items];
        newItems.push({
            codigo: 'MANUAL',
            descripcion: manualItem.desc,
            cantidad: qty,
            precioUnitario: price
        });
        setItems(newItems);
        saveOrderChanges(newItems);
        setShowManual(false);
        setManualItem({ desc: '', price: '', qty: '1' });
    };

    const handlePrint = async () => {
        try {
            const dto = {
                clienteNombre: order.cliente || "Consumidor Final",
                clienteTelefono: "",
                observaciones: "Detalle de Venta #" + (order.numeroOrden || order.id),
                dniCuit: "",
                condicionIva: "Consumidor Final",
                ciudad: "",
                provincia: "",
                items: items.map((i: any) => ({
                    productId: i.productId,
                    description: i.descripcion,
                    price: i.precioUnitario,
                    quantity: i.cantidad
                }))
            };

            const response = await fetch(`${apiBase}/presupuestos/pdf`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dto),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Pedido_${order.numeroOrden || order.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Error generating PDF", err);
            alert("Error al generar PDF");
        }
    };

    const saveOrderChanges = async (updatedItems: any[]) => {
        try {
            const payload = {
                ...order,
                items: updatedItems,
                total: updatedItems.reduce((acc, i) => acc + (i.precioUnitario * i.cantidad), 0)
            };
            await fetch(`${apiBase}/pedidos/${order.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Failed to save order", err);
        }
    };

    const handlePaymentClick = (method: string) => {
        setPaymentMethod(method);
        if (method === 'EFECTIVO') {
            setCashOpen(true);
        } else {
            processPayment(method, total);
        }
    };

    const handleCashConfirm = () => {
        const amount = cashAmount ? parseFloat(cashAmount) : total;
        processPayment('EFECTIVO', amount);
    };

    const processPayment = async (method: string, amount: number) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const payload = {
                montoEntregado: amount,
                metodoPago: method,
                total: total
            };
            const res = await fetch(`${apiBase}/pedidos/${order.id}/cerrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const result = await res.json();
                setLastChange(result.cambio || 0);
                setCashOpen(false);
                setShowSuccess(true); // Show success modal instead of alert
            } else {
                alert("Error al procesar pago");
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setIsProcessing(false);
        }
    };

    // Client-side filter is no longer needed, using server results directly
    const filteredProducts = products;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
            {/* ... (Existing Main Modal Code unchanged) ... */}
            <div className={`bg-slate-900 w-full max-w-6xl h-full md:h-[90vh] rounded-none md:rounded-2xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row print:w-full print:h-auto print:border-0 print:shadow-none`}>
                {/* ... (Existing Left/Right Panels unchanged) ... */}

                {/* LEFT: Order Details & Edit */}
                <div className="flex-1 flex flex-col border-r border-slate-800">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-950/50">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span>Orden #{order.numeroOrden || order.id.toString().slice(-4)}</span>
                                <span className={`text-xs px-2 py-1 rounded border ${order.cliente ? 'border-sky-500 text-sky-400' : 'border-slate-600 text-slate-500'}`}>
                                    {order.cliente || "Consumidor Final"}
                                </span>
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                Vendedor: {order.vendedorNombre || "N/A"}
                            </p>
                        </div>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={handlePrint} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
                                <Printer size={20} />
                            </button>
                            <button onClick={onClose} className="p-2 bg-red-500/10 rounded hover:bg-red-500/20 text-red-500">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="p-3 grid grid-cols-2 gap-2 bg-slate-900 border-b border-slate-800 print:hidden">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95"
                        >
                            <Search size={18} />
                            Agregar Producto
                        </button>
                        <button
                            onClick={() => setShowManual(true)}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-medium border border-slate-700 active:scale-95"
                        >
                            <Plus size={18} />
                            Item Manual
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-2 custom-scrollbar space-y-2">
                        {items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-600 group transition-all">
                                <button
                                    onClick={() => handleUpdateItem(idx, -item.cantidad)}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors print:hidden"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="flex-1">
                                    <p className="font-medium text-slate-200 line-clamp-1">{item.descripcion || item.producto?.descripcion}</p>
                                    <div className="flex items-center gap-4 text-sm mt-1">
                                        <div className="font-mono text-slate-400">
                                            {item.codigo}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 h-10 print:border-0 print:bg-transparent">
                                    <button onClick={() => handleUpdateItem(idx, -1)} className="w-8 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 rounded-l-lg print:hidden">-</button>
                                    <input
                                        className="w-12 bg-transparent text-center font-bold text-white focus:outline-none print:text-black"
                                        value={item.cantidad}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            const newItems = [...items];
                                            if (isNaN(val) || e.target.value === '') {
                                                // Allow empty string or non-numeric momentarily for typing
                                                // @ts-ignore
                                                newItems[idx].cantidad = e.target.value === '' ? '' : item.cantidad;
                                            } else {
                                                newItems[idx].cantidad = val;
                                            }
                                            setItems(newItems);
                                        }}
                                        onBlur={() => {
                                            // Restore to 1 if empty on blur
                                            if (item.cantidad === '' || item.cantidad === 0) {
                                                const newItems = [...items];
                                                newItems[idx].cantidad = 1;
                                                setItems(newItems);
                                                saveOrderChanges(newItems);
                                            } else {
                                                saveOrderChanges(items);
                                            }
                                        }}

                                    />
                                    <button onClick={() => handleUpdateItem(idx, 1)} className="w-8 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 rounded-r-lg print:hidden">+</button>
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <div className="flex items-center justify-end font-mono text-slate-300 cursor-pointer hover:text-indigo-400"
                                        onClick={() => {
                                            const newP = prompt("Nuevo Precio:", item.precioUnitario);
                                            if (newP) handlePriceEdit(idx, newP);
                                        }}>
                                        ${item.precioUnitario}
                                    </div>
                                    <div className="font-bold text-emerald-400 font-mono text-lg print:text-black">
                                        ${(item.precioUnitario * (typeof item.cantidad === 'number' ? item.cantidad : 0)).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Footer */}
                    <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400 uppercase font-bold text-sm">Total Items: {items.length}</span>
                        <div className="text-right">
                            <div className="text-sm text-slate-500 text-right">Subtotal</div>
                            <div className="text-2xl font-bold text-white font-mono">${total.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Payment Panel (Hidden on Print) */}
                <div className="w-full md:w-[450px] bg-slate-950 flex flex-col relative z-0 print:hidden">
                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        <h3 className="text-slate-400 font-bold uppercase text-sm tracking-wider mb-2">Medios de Pago</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handlePaymentClick('EFECTIVO')} className="col-span-1 h-32 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg p-4 flex flex-col justify-between items-start hover:scale-[1.02] active:scale-95 transition-all text-left">
                                <div className="ml-auto opacity-50"><Banknote size={40} /></div>
                                <div><div className="font-bold text-white text-lg">Efectivo</div><div className="text-emerald-100 text-sm opacity-90">${(total * 0.9).toLocaleString()}</div></div>
                            </button>
                            <button onClick={() => handlePaymentClick('TRANSFERENCIA')} className="col-span-1 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-4 flex flex-col justify-between items-start hover:scale-[1.02] active:scale-95 transition-all text-left">
                                <div className="ml-auto opacity-50"><Landmark size={40} /></div>
                                <div><div className="font-bold text-white text-lg">Transferencia</div><div className="text-blue-100 text-sm opacity-90">${total.toLocaleString()}</div></div>
                            </button>
                            <button onClick={() => handlePaymentClick('DEBITO')} className="col-span-1 h-28 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-4 flex flex-col justify-between text-left hover:scale-[1.02] active:scale-95 transition-all">
                                <CreditCard className="ml-auto opacity-30 text-white" />
                                <div className="mt-auto"><div className="font-bold text-white">Débito</div><div className="text-white/80 text-sm">${total.toLocaleString()}</div></div>
                            </button>
                            <button onClick={() => handlePaymentClick('CUOTAS_3')} className="col-span-1 h-28 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-2xl shadow-lg p-4 flex flex-col justify-between text-left hover:scale-[1.02] active:scale-95 transition-all">
                                <span className="ml-auto text-[10px] font-bold bg-white/20 px-1 rounded text-white">S/ INTERÉS</span>
                                <div className="mt-auto"><div className="font-bold text-white">3 Cuotas</div><div className="text-white/80 text-sm">${(total / 3).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</div></div>
                            </button>
                            <button onClick={() => handlePaymentClick('NARANJA_8')} className="col-span-2 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg p-4 flex items-center justify-between text-left hover:scale-[1.01] active:scale-95 transition-all">
                                <div className="z-10"><div className="font-bold text-white text-lg">Naranja 8 Cuotas</div><div className="text-orange-100 text-sm opacity-90">Plan Z / Clásica</div></div>
                                <div className="text-right z-10"><div className="text-2xl font-bold text-white">${(total / 8).toFixed(2)}</div><div className="text-xs text-orange-200">/mes</div></div>
                            </button>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-900 border-t border-slate-800">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-slate-400 font-medium">Total a Pagar</span>
                            <span className="text-4xl font-bold text-white tracking-tight">${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}

            {/* 1. SEARCH MODAL */}
            {showSearch && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Buscar Producto</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowSearch(false); setShowManual(true); }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Manual
                                </button>
                                <button onClick={() => setShowSearch(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Buscar por código, nombre o marca..."
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {searchQuery.trim() === '' ? (
                                <div className="text-center text-slate-500 py-8">Escribe para buscar...</div>
                            ) : (
                                <>
                                    {filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => handleAddProduct(p)} className="w-full flex justify-between items-center p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 transition-all text-left group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{p.description}</div>
                                                    {p.marca && <span className="bg-indigo-900/50 text-indigo-300 text-[10px] px-2 py-0.5 rounded border border-indigo-500/30 uppercase font-bold tracking-wider">{p.marca}</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono group-hover:text-slate-400">{p.code}</div>
                                            </div>
                                            <div className="font-bold text-emerald-400 text-lg">${p.price.toLocaleString()}</div>
                                        </button>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="text-center text-slate-500 py-8">No se encontraron productos</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. MANUAL ITEM MODAL */}
            {showManual && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleAddManual} className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Item Manual</h3>
                            <button type="button" onClick={() => setShowManual(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Descripción</label>
                                <input autoFocus required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" value={manualItem.desc} onChange={e => setManualItem({ ...manualItem, desc: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-1">Precio</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" value={manualItem.price} onChange={e => setManualItem({ ...manualItem, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm mb-1">Cantidad</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" value={manualItem.qty} onChange={e => setManualItem({ ...manualItem, qty: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4">Agregar Item</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. CASH MODAL */}
            {cashOpen && (
                <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-6 text-center">Pago en Efectivo</h3>
                        <div className="mb-6">
                            <label className="block text-slate-400 text-sm font-bold mb-2">Monto Recibido</label>
                            <input
                                type="number"
                                autoFocus
                                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-xl p-4 text-2xl font-bold text-white text-center outline-none transition-colors"
                                placeholder={total.toString()}
                                value={cashAmount}
                                onChange={e => setCashAmount(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleCashConfirm() }}
                            />
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl mb-6 flex justify-between items-center border border-slate-700">
                            <span className="text-slate-400 font-medium">Vuelto:</span>
                            <span className={`text-xl font-bold font-mono ${(cashAmount && parseFloat(cashAmount) < total) ? 'text-red-400' : 'text-emerald-400'}`}>
                                ${((parseFloat(cashAmount) || 0) - total).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setCashOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors">Cancelar</button>
                            <button onClick={handleCashConfirm} disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50">{isProcessing ? '...' : 'Cobrar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SUCCESS MODAL */}
            {showSuccess && (
                <div className="absolute inset-0 z-[70] bg-emerald-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center transform scale-100 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                            <Check size={48} strokeWidth={4} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">¡Pago Exitoso!</h2>
                        <p className="text-slate-500 mb-8">El pedido ha sido cerrado correctamente.</p>

                        {lastChange > 0 && (
                            <div className="bg-emerald-50 w-full p-4 rounded-xl border border-emerald-100 mb-8">
                                <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">Su Vuelto</div>
                                <div className="text-4xl font-black text-emerald-700">${lastChange.toLocaleString()}</div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowSuccess(false);
                                onUpdate();
                                onClose();
                            }}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-lg hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
                        >
                            Listo, Siguiente Pedido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
