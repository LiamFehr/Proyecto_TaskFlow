import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, CheckCircle2, CreditCard, Landmark, PackagePlus, Tag, ShoppingBag, Trash2, ShoppingCart, ShoppingBag as QrCode, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '../utils/request';
import { useAuthStore } from '../store/authStore';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import QRScanner from '../components/scanner/QRScanner';

interface Product {
    id: number;
    code: string;
    description: string;
    price: number;
    stock: number;
    marca?: string;
}

interface CartItem extends Product {
    quantity: number | '';
    vatRate?: number; // Alícuota IVA en % (21, 10.5, 0)
}

export default function SellerOrdersPage() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [clienteNombre, setClienteNombre] = useState('');
    const [vendedorNombre] = useState((user as any)?.username || (user as any)?.nombre || 'Vendedor');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [code, setCode] = useState('');

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastOrder, setLastOrder] = useState<{ id: number; turno: string } | null>(null);
    const [orderUuid, setOrderUuid] = useState(crypto.randomUUID());
    const [isSearching, setIsSearching] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const clickingRef = useRef(false);

    useEffect(() => {
        const saved = localStorage.getItem('seller_cart');
        if (saved) { try { setCart(JSON.parse(saved)); } catch { /* ignore */ } }
    }, []);

    useEffect(() => {
        localStorage.setItem('seller_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'F1') { e.preventDefault(); setIsSearchModalOpen(true); }
            if (e.key === 'F3') { e.preventDefault(); setIsQRScannerOpen(true); }
            if (e.key === 'F2') { e.preventDefault(); setIsCustomItemModalOpen(true); }
            if (e.key === 'F4') { e.preventDefault(); setIsPromoModalOpen(true); }
            if (e.key === 'Escape') {
                setIsSearchModalOpen(false);
                setIsQRScannerOpen(false);
                setIsCustomItemModalOpen(false);
                setIsPromoModalOpen(false);
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    const handleSearch = async (e?: React.FormEvent, overrideCode?: string) => {
        if (e) e.preventDefault();
        const searchCode = overrideCode || code;
        if (!searchCode.trim()) return;

        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const res = await http.get(`/products/v1/search-exact?q=${searchCode}`, token);
            if (res) {
                addToCart(res);
                setCode('');
                toast.success(`Agregado: ${res.description}`);
                setTimeout(() => inputRef.current?.focus(), 100);
            } else {
                toast.error('Producto no encontrado');
            }
        } catch (err) {
            toast.error('Producto no encontrado en stock');
        } finally {
            setIsSearching(false);
        }
    };

    const addToCart = (product: Product) => addToCartWithQty(product, 1);

    const addToCartWithQty = (product: Product, qty: number) => {
        setCart((prev) => {
            const exists = prev.find((i) => i.code === product.code);
            if (exists) return prev.map((i) => i.code === product.code ? { ...i, quantity: (i.quantity === '' ? 0 : i.quantity) + qty } : i);
            return [...prev, { ...product, quantity: qty }];
        });
        toast.success(`${product.description} agregado`);
    };

    const addManualItem = (desc: string, price: number, qty: number, vatRate: number) => {
        setCart(prev => [...prev, { id: Date.now(), code: 'MANUAL', description: desc, price, stock: 9999, quantity: qty, vatRate }]);
        toast.success('Item manual agregado');
    };

    const removeFromCart = (code: string) => setCart((prev) => prev.filter((i) => i.code !== code));

    const updateQuantity = (code: string, val: string) => {
        if (val === '') { setCart(prev => prev.map(i => i.code === code ? { ...i, quantity: '' } : i)); return; }
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) setCart((prev) => prev.map((i) => i.code === code ? { ...i, quantity: num } : i));
    };

    const getQty = (q: number | '') => (q === '' ? 0 : q);
    const total = cart.reduce((acc, i) => acc + i.price * getQty(i.quantity), 0);

    const handleCreateOrder = async () => {
        if (cart.length === 0 || isProcessing || clickingRef.current) return;
        clickingRef.current = true;
        setIsProcessing(true);
        try {
            const uuid = orderUuid;
            const payload = {
                uuid,
                clienteNombre: clienteNombre || 'CONSUMIDOR FINAL',
                terminal: 'VENDEDOR-MOVIL',
                items: cart.map(i => ({
                    productoId:    i.code !== 'MANUAL' ? i.id : null,
                    descripcion:   i.description,
                    cantidad:      getQty(i.quantity),
                    precioUnitario: i.price,
                    vatRate:       i.vatRate ?? null, // IVA: null = el backend usa el vatRate del producto del catálogo
                })),
                total,
            };
            const res = await http.post('/pedidos/remotos', payload, token);
            setLastOrder({ id: res.id, turno: res.turno ?? res.numeroOrden });
            // Esperar que el ERP confirme y actualice el número de turno
            setTimeout(async () => {
                try {
                    const updated = await http.get(`/pedidos/${res.id}`, token);
                    if (updated?.numeroOrden) setLastOrder({ id: res.id, turno: updated.numeroOrden });
                } catch { /* ignorar */ }
            }, 2000);
            setCart([]);
            setClienteNombre('');
            setCode('');
            localStorage.removeItem('seller_cart');
            setOrderUuid(crypto.randomUUID());
        } catch { toast.error('Error al derivar el pedido'); }
        finally { 
            setIsProcessing(false); 
            clickingRef.current = false;
        }
    };

    // ── Shared JSX blocks (rendered in mobile OR desktop column) ───────────
    const cartCard = (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <ShoppingBag size={17} className="text-blue-600" />
                    <span className="font-bold text-gray-800 text-sm">Carrito</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-600 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </span>
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="p-1 text-gray-300 hover:text-red-400 transition-colors" title="Vaciar">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            {cart.length === 0 ? (
                <div className="py-14 flex flex-col items-center text-gray-200">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-3" />
                    <p className="text-sm font-medium text-gray-300">Carrito vacío</p>
                </div>
            ) : (
                <div>
                    {cart.map((item, idx) => (
                        <div key={`${item.code}-${idx}`}
                            className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 leading-tight">{item.description}</p>
                                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                    {item.code && item.code !== 'MANUAL' && <span className="text-blue-400 mr-1.5">{item.code}</span>}
                                    ${item.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })} × {item.quantity}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.code, e.target.value)}
                                    className="w-14 text-center text-sm border border-gray-200 rounded-lg py-1.5 outline-none font-bold focus:ring-2 focus:ring-blue-400 bg-white"
                                />
                                <span className="text-sm font-black text-gray-900 tabular-nums w-20 text-right">
                                    ${(item.price * getQty(item.quantity)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                                <button onClick={() => removeFromCart(item.code)}
                                    className="p-1.5 text-gray-200 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                                    <X size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const footerBar = (
        <>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-medium">Total a Cobrar</span>
                <span className="text-3xl font-black text-gray-900 tabular-nums">
                    ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            </div>
            <button
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || isProcessing}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 shadow-lg shadow-blue-200"
            >
                <CheckCircle2 size={19} strokeWidth={2.5} />
                {isProcessing ? 'Procesando...' : 'Cerrar Pedido'}
            </button>
        </>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">

            {/* ── Responsive layout: 1 col mobile / 2 col desktop ─── */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col lg:flex-row">

                    {/* ── LEFT PANEL: controls (both mobile + desktop) ── */}
                    <div className="flex-1 min-h-0 lg:flex-none lg:w-[380px] xl:w-[420px] overflow-y-auto lg:border-r border-gray-100">
                        <div className="px-4 py-3 space-y-3 max-w-2xl mx-auto lg:max-w-none">

                            {/* Vendedor / Cliente */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendedor</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{vendedorNombre}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Cliente <span className="text-red-400">*</span></p>
                                    <input
                                        value={clienteNombre}
                                        onChange={(e) => setClienteNombre(e.target.value)}
                                        placeholder="Nombre del cliente..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                <ActionBtn icon={Search} label="Buscar" active={isSearchModalOpen} onClick={() => setIsSearchModalOpen(true)} />
                                <ActionBtn icon={QrCode} label="QR" active={isQRScannerOpen} onClick={() => setIsQRScannerOpen(true)} />
                                <ActionBtn icon={PackagePlus} label="Manual" active={isCustomItemModalOpen} onClick={() => setIsCustomItemModalOpen(true)} />
                                <ActionBtn icon={Tag} label="Promos" active={isPromoModalOpen} onClick={() => setIsPromoModalOpen(true)} />
                            </div>

                            {/* Code input */}
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="tel"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="Código de barras o producto..."
                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300 placeholder:font-normal shadow-sm"
                                    autoComplete="off"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                                <button type="submit"
                                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all active:scale-95 shadow-sm">
                                    {isSearching ? '...' : '↵'}
                                </button>
                            </form>

                            {/* Cart (mobile only — on desktop it lives in the right panel) */}
                            <div className="lg:hidden">{cartCard}</div>
                            <div className="h-1 lg:hidden" />
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: cart + footer (desktop only) ─── */}
                    <div className="hidden lg:flex flex-col flex-1 min-w-0">
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-4 h-full">
                                {cartCard}
                            </div>
                        </div>
                        <div className="bg-white border-t border-gray-100 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                            {footerBar}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Mobile sticky footer ─────────────────────────────── */}
            <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
                {footerBar}
            </div>

            {/* ── Modals ─────────────────────────────────────────── */}
            <AnimatePresence>
                {isSearchModalOpen && (
                    <SearchModal token={token} onClose={() => setIsSearchModalOpen(false)} onSelect={(p: Product, qty: number) => { addToCartWithQty(p, qty); setIsSearchModalOpen(false); }} />
                )}
                {isQRScannerOpen && (
                    <QRScanner
                        onDetect={(scanned) => {
                            setIsQRScannerOpen(false);
                            handleSearch(undefined, scanned);
                        }}
                        onClose={() => setIsQRScannerOpen(false)} />
                )}
                {isCustomItemModalOpen && (
                    <ManualModal onClose={() => setIsCustomItemModalOpen(false)} onAdd={addManualItem} />
                )}
                {isPromoModalOpen && (
                    <PromoModal onClose={() => setIsPromoModalOpen(false)} />
                )}
                {lastOrder && (
                    <SuccessModal turno={lastOrder.turno} onClose={() => setLastOrder(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ActionBtn({ icon: Icon, label, onClick, active = false }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-95 font-black text-xs uppercase tracking-widest
                ${active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:text-blue-600 shadow-sm'}`}
        >
            <Icon size={22} strokeWidth={2} />
            {label}
        </button>
    );
}

function Overlay({ onClose, children }: any) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="w-full sm:w-auto"
                onClick={e => e.stopPropagation()}>
                {children}
            </motion.div>
        </motion.div>
    );
}

function SearchModal({ token, onClose, onSelect }: any) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Product | null>(null);
    const [qty, setQty] = useState(1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (query.length < 2) { setResults([]); return; }
            setLoading(true);
            try {
                const res = await http.get(`/vendedor/productos?search=${encodeURIComponent(query)}`, token);
                setResults(Array.isArray(res) ? res : []);
            } finally { setLoading(false); }
        }, 260);
        return () => clearTimeout(t);
    }, [query]);

    const handleSelect = (p: Product) => { setSelected(p); setQty(1); };
    const handleAdd = () => { if (!selected) return; onSelect(selected, qty); };

    return (
        <Overlay onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[82vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Search size={17} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm text-gray-900 uppercase tracking-tight leading-none">Buscador de Artículos</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Inventario Centralizado</p>
                    </div>
                    <span className="text-[10px] font-black text-gray-300 bg-gray-100 px-2 py-1 rounded-md hidden sm:inline">F1</span>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
                </div>

                {/* Search input */}
                <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400 transition-all">
                        <Search size={15} className="text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            autoFocus
                            value={query}
                            onChange={e => { setQuery(e.target.value.toUpperCase()); setSelected(null); }}
                            placeholder="Ingresá descripción, marca o código del producto..."
                            className="flex-1 text-sm font-semibold uppercase bg-transparent outline-none placeholder:text-gray-300 placeholder:normal-case placeholder:font-normal"
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); setResults([]); setSelected(null); inputRef.current?.focus(); }}
                                className="text-gray-300 hover:text-gray-500 transition-colors"><X size={14} /></button>
                        )}
                    </div>
                </div>

                {/* Column headers — full on desktop, simplified on mobile */}
                <div className="hidden sm:grid px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0"
                    style={{ gridTemplateColumns: '96px 1fr 112px 64px 96px' }}>
                    {['CÓDIGO', 'DESCRIPCIÓN', 'MARCA', 'STOCK', 'PRECIO'].map((h, i) => (
                        <span key={h} className={`text-[9px] font-black uppercase tracking-widest text-gray-400 ${i >= 2 ? 'text-center' : ''} ${i === 4 ? 'text-right' : ''}`}>{h}</span>
                    ))}
                </div>
                <div className="grid sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0"
                    style={{ gridTemplateColumns: '1fr 76px' }}>
                    {['DESCRIPCIÓN', 'PRECIO'].map((h, i) => (
                        <span key={h} className={`text-[9px] font-black uppercase tracking-widest text-gray-400 ${i === 1 ? 'text-right' : ''}`}>{h}</span>
                    ))}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        results.map(p => (
                            <div key={p.id} onClick={() => handleSelect(p)}
                                className={`cursor-pointer transition-all select-none border-b border-gray-50
                                    ${selected?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50'}`}>
                                {/* Desktop row */}
                                <div className="hidden sm:grid items-center px-4 py-3"
                                    style={{ gridTemplateColumns: '96px 1fr 112px 64px 96px' }}>
                                    <span className="font-mono text-xs text-gray-400 truncate pr-2">{p.code}</span>
                                    <span className={`text-sm font-semibold truncate pr-3 ${selected?.id === p.id ? 'text-blue-700' : 'text-gray-800'}`}>{p.description}</span>
                                    <span className="text-xs text-gray-400 truncate text-center">{p.marca || '—'}</span>
                                    <span className={`text-xs font-bold text-center ${(p.stock ?? 99) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.stock ?? '—'}</span>
                                    <span className="text-sm font-black text-gray-900 text-right">${p.price.toLocaleString('es-AR')}</span>
                                </div>
                                {/* Mobile row */}
                                <div className="grid sm:hidden items-center px-4 py-3"
                                    style={{ gridTemplateColumns: '1fr 76px' }}>
                                    <div className="min-w-0 pr-2">
                                        <p className={`text-sm font-semibold truncate ${selected?.id === p.id ? 'text-blue-700' : 'text-gray-800'}`}>{p.description}</p>
                                        <p className="font-mono text-[10px] text-gray-400 mt-0.5">{p.code}{p.marca ? ` · ${p.marca}` : ''}</p>
                                    </div>
                                    <span className="text-sm font-black text-gray-900 text-right">${p.price.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-200">
                            <ShoppingCart size={40} strokeWidth={1} className="mb-3" />
                            <p className="text-xs text-gray-400 uppercase tracking-widest">
                                {query.length >= 2 ? `Sin resultados para "${query}"` : 'Ingresá al menos 2 caracteres...'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Cantidad:</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest sm:hidden">Cant.:</span>
                        <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={!selected}
                                className="px-2 sm:px-2.5 py-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30">
                                <Minus size={13} />
                            </button>
                            <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                                disabled={!selected}
                                className="w-10 sm:w-12 text-center text-sm font-black outline-none bg-transparent py-1.5 disabled:opacity-30" />
                            <button onClick={() => setQty(q => q + 1)} disabled={!selected}
                                className="px-2 sm:px-2.5 py-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30">
                                <Plus size={13} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button onClick={onClose}
                            className="px-3 sm:px-4 py-2 text-sm font-black text-gray-500 hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-wide whitespace-nowrap">
                            <span className="sm:hidden">Cerrar</span>
                            <span className="hidden sm:inline">Cerrar (Esc)</span>
                        </button>
                        <button onClick={handleAdd} disabled={!selected}
                            className="px-3 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white text-sm font-black rounded-xl transition-all uppercase tracking-wide active:scale-95 whitespace-nowrap">
                            <span className="sm:hidden">Agregar</span>
                            <span className="hidden sm:inline">Agregar Seleccionado</span>
                        </button>
                    </div>
                </div>
            </div>
        </Overlay>
    );
}

function ManualModal({ onClose, onAdd }: any) {
    const [desc, setDesc] = useState('');
    const [price, setPrice] = useState('');
    const [qty, setQty] = useState('1');
    const [iva, setIva] = useState('21.0% (GENERAL)');

    const handleSubmit = () => {
        if (!desc.trim() || !price) return;
        // Parsear el vatRate desde el string del select (ej: "10.5%" -> 10.5, "21.0% (GENERAL)" -> 21.0, "0% (EXENTO)" -> 0)
        const vatNum = parseFloat(iva);
        const parsedVat = isNaN(vatNum) ? 21.0 : vatNum;
        onAdd(desc.toUpperCase(), Number(price), Number(qty) || 1, parsedVat);
        onClose();
    };

    return (
        <Overlay onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <PackagePlus size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm text-gray-900 uppercase tracking-tight leading-none">Carga de Ítem Manual</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Ingreso directo de conceptos no inventariados</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Concepto / Descripción del Ítem</label>
                        <input value={desc} onChange={e => setDesc(e.target.value)} autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold uppercase bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all"
                            placeholder="DESCRIPCIÓN DEL ÍTEM..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">$ Precio Unit. ($)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                                inputMode="numeric"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all"
                                placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Cantidad</label>
                            <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                                inputMode="numeric"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all"
                                placeholder="1" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">% Alícuota IVA</label>
                        <select value={iva} onChange={e => setIva(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all">
                            <option>21.0% (GENERAL)</option>
                            <option>10.5%</option>
                            <option>0% (EXENTO)</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-3">
                    <button onClick={onClose}
                        className="px-5 py-2.5 text-sm font-black text-gray-500 hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-wide">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={!desc.trim() || !price}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl disabled:opacity-30 transition-all active:scale-95 uppercase tracking-wide">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        </Overlay>
    );
}

function PromoModal({ onClose }: any) {
    const { methods, loading } = usePaymentMethods();
    return (
        <Overlay onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <p className="font-black text-gray-900 text-sm uppercase tracking-tight">Métodos de Pago y Promos</p>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="max-h-[480px] overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>
                    ) : methods.map((m: any) => {
                        const isSurcharge = m.adjustmentType === 'surcharge_percent';
                        const hasAdj = m.adjustmentType !== 'none' && m.adjustmentValue !== 0;
                        return (
                            <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600 border border-gray-100">
                                        {m.type === 'CREDIT' ? <CreditCard size={18} /> : <Landmark size={18} />}
                                    </div>
                                    <span className="font-bold text-sm text-gray-800">{m.name}</span>
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide
                                    ${!hasAdj ? 'bg-emerald-100 text-emerald-600' : isSurcharge ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {!hasAdj ? 'Sin recargo' : `${isSurcharge ? '+' : '-'}${m.adjustmentValue}%`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Overlay>
    );
}

function SuccessModal({ turno, onClose }: any) {
    return (
        <Overlay onClose={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[380px] text-center p-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">Pedido Enviado</h2>
                <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em] mb-8">Orden lista para caja</p>
                <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">N° de Turno</p>
                    <p className="text-7xl font-black text-gray-900 tabular-nums leading-none">{turno}</p>
                </div>
                <button onClick={onClose}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2">
                    <Plus size={18} strokeWidth={3} /> NUEVA VENTA
                </button>
            </div>
        </Overlay>
    );
}
