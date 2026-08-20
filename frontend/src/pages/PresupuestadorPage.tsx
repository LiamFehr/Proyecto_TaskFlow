import { useState, useEffect, useRef, FormEvent } from 'react';
import { usePresupuestoStore } from '../store/presupuestoStore';
import {
    Search, Trash2, PackagePlus, X, FileDown, Save, History,
    ChevronRight, ShoppingCart, AlertCircle, Clock, User,
    Package, Plus, Minus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { presupuestoApi } from '../api/presupuestoApi';
import { http } from '../utils/request';
import { toast } from 'sonner';
import { printPresupuesto } from '../utils/presupuestoHtml';
import { AnimatePresence, motion } from 'framer-motion';

const IVA_CONDITIONS = ['Consumidor Final', 'Responsable Inscripto', 'Monotributista', 'Exento', 'No Responsable'];

function ActionBtn({ icon: Icon, label, onClick, active = false }: any) {
    return (
        <button onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-95 font-black text-xs uppercase tracking-widest
                ${active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:text-blue-600 shadow-sm'}`}>
            <Icon size={22} strokeWidth={2} />
            {label}
        </button>
    );
}
interface Product {
    id: number;
    code: string;
    description: string;
    price: number;
    stock?: number;
    marca?: string;
}

interface HistorialItem {
    id: number;
    clienteNombre: string;
    total: number;
    fecha: string;
    items: { description: string; price: number; quantity: number; productId?: number }[];
    clienteTelefono?: string;
    dniCuit?: string;
    condicionIva?: string;
    ciudad?: string;
    provincia?: string;
    observaciones?: string;
}

export default function PresupuestadorPage() {
    const {
        items, addItem, removeItem, updateQuantity,
        clientName, clientPhone, observations, dniCuit, condicionIva, ciudad, provincia, filename,
        setClientInfo, setItems, clear,
    } = usePresupuestoStore();

    const token = useAuthStore((s) => s.token);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historial, setHistorial] = useState<HistorialItem[]>([]);
    const [historialLoading, setHistorialLoading] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [toPedidoLoading, setToPedidoLoading] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    const total = items.reduce((acc: number, i: any) => acc + i.price * i.quantity, 0);

    const loadHistorial = async () => {
        setHistorialLoading(true);
        try {
            const data = await presupuestoApi.list();
            setHistorial(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Error al cargar historial');
        } finally {
            setHistorialLoading(false);
        }
    };

    useEffect(() => {
        if (showHistory) loadHistorial();
    }, [showHistory]);

    const buildPayload = () => ({
        clienteNombre: clientName || 'CONSUMIDOR FINAL',
        clienteTelefono: clientPhone,
        observaciones: observations,
        dniCuit,
        condicionIva,
        ciudad,
        provincia,
        items: items.map((i: any) => ({
            productId: i.productId ?? null,
            description: i.description,
            price: i.price,
            quantity: i.quantity,
        })),
    });

    const handleSave = async () => {
        if (items.length === 0) { toast.error('Agregá al menos un ítem'); return; }
        setSaving(true);
        try {
            let saved: any;
            if (currentId) {
                saved = await presupuestoApi.update(currentId, buildPayload());
                toast.success('Presupuesto actualizado');
            } else {
                saved = await presupuestoApi.save(buildPayload());
                setCurrentId(saved.id);
                toast.success('Presupuesto guardado');
            }
            if (showHistory) loadHistorial();
        } catch {
            toast.error('Error al guardar presupuesto');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = () => {
        if (items.length === 0) return;
        printPresupuesto({
            clientName,
            clientPhone,
            dniCuit,
            condicionIva,
            ciudad,
            provincia,
            observations,
            items: items.map((i: any) => ({
                description: i.description,
                code: i.code,
                price: i.price,
                quantity: i.quantity,
            })),
            total,
        });
    };

    const handleLoadFromHistory = (h: HistorialItem) => {
        setClientInfo(
            h.clienteNombre || '',
            h.clienteTelefono || '',
            h.observaciones || '',
            h.dniCuit || '',
            h.condicionIva || 'Consumidor Final',
            h.ciudad || '',
            h.provincia || '',
            ''
        );
        setItems((h.items || []).map((i: any) => ({
            productId: i.productId ?? undefined,
            description: i.description,
            price: Number(i.price),
            quantity: Number(i.quantity),
        })));
        setCurrentId(h.id);
        setShowHistory(false);
        toast.success(`Cargado: ${h.clienteNombre}`);
    };

    const handleToPedido = async (id: number) => {
        setToPedidoLoading(id);
        try {
            await presupuestoApi.toPedido(id);
            toast.success('Pedido creado en cola');
        } catch {
            toast.error('Error al crear pedido');
        } finally {
            setToPedidoLoading(null);
        }
    };

    const handleDeleteHistorial = async (id: number) => {
        setDeleteLoading(id);
        try {
            await presupuestoApi.delete(id);
            setHistorial(prev => prev.filter(h => h.id !== id));
            if (currentId === id) { clear(); setCurrentId(null); }
            toast.success('Eliminado');
        } catch {
            toast.error('Error al eliminar');
        } finally {
            setDeleteLoading(null);
        }
    };

    const [mobileCode, setMobileCode] = useState('');
    const codeInputRef = useRef<HTMLInputElement>(null);

    const handleMobileCodeSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = mobileCode.trim();
        if (!trimmed) return;
        try {
            const res = await http.get(`/vendedor/productos?search=${trimmed}`, token);
            const results = Array.isArray(res) ? res : [];
            if (results.length > 0) {
                const exact = results.find((r: Product) => r.code.toLowerCase() === trimmed.toLowerCase());
                const product: Product = exact || results[0];
                addItem({ productId: product.id, code: product.code, description: product.description, price: product.price, quantity: 1 });
                setMobileCode('');
                setTimeout(() => codeInputRef.current?.focus(), 50);
            } else {
                toast.error('Producto no encontrado');
                setMobileCode('');
            }
        } catch { toast.error('Error al buscar producto'); }
    };

    const itemsCard = (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package size={13} className="text-blue-600" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ítems</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {items.length} ítem{items.length !== 1 ? 's' : ''}
                    </span>
                    {items.length > 0 && (
                        <button onClick={() => { clear(); setCurrentId(null); }}
                            className="p-1 text-gray-300 hover:text-red-400 transition-colors" title="Vaciar">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>
            {items.length === 0 ? (
                <div className="py-10 flex flex-col items-center">
                    <Package size={36} strokeWidth={1} className="mb-2 text-gray-200" />
                    <p className="text-xs text-gray-300 font-medium">Sin ítems — usá Buscar o Manual</p>
                </div>
            ) : (
                <div>
                    {items.map((item: any, idx: number) => (
                        <div key={item.id}
                            className={`flex items-center gap-3 px-4 py-3 ${idx < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{item.description}</p>
                                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                    {item.code && <span className="text-blue-400 mr-1.5">{item.code}</span>}
                                    ${item.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })} × {item.quantity}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                        className="px-2.5 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                        <Minus size={12} />
                                    </button>
                                    <input type="number" value={item.quantity}
                                        inputMode="numeric"
                                        onChange={e => updateQuantity(item.id, Number(e.target.value))}
                                        className="w-10 text-center text-sm font-black outline-none bg-white py-2" />
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="px-2.5 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <span className="text-sm font-black text-gray-900 tabular-nums w-20 text-right">
                                    ${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                                <button onClick={() => removeItem(item.id)}
                                    className="p-1.5 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const footerBar = (
        <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-medium">Total</span>
                <span className="text-3xl font-black text-gray-900 tabular-nums">
                    ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            </div>
            <button onClick={handleSave} disabled={items.length === 0 || saving}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 shadow-lg shadow-blue-200">
                {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save size={19} strokeWidth={2.5} />}
                {saving ? 'Guardando...' : currentId ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">

            {/* ── Layout ─────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-h-0">
                {showHistory ? (
                    <HistoryPanel
                        historial={historial} loading={historialLoading} currentId={currentId}
                        toPedidoLoading={toPedidoLoading} deleteLoading={deleteLoading}
                        onLoad={handleLoadFromHistory} onToPedido={handleToPedido}
                        onDelete={handleDeleteHistorial} onRefresh={loadHistorial}
                    />
                ) : (
                    <div className="flex flex-row flex-1 min-h-0">

                        {/* ── Left Panel ── controls ────────────────────── */}
                        <div className="flex flex-col flex-1 min-h-0 lg:flex-none lg:w-[400px] xl:w-[440px] lg:border-r lg:border-gray-100">
                            <div className="flex-1 overflow-y-auto">
                                <div className="px-3 py-3 space-y-3">

                                    {/* Client card */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="bg-slate-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
                                            <User size={13} className="text-blue-600" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Datos del Cliente</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <MobileField label="Nombre" placeholder="CONSUMIDOR FINAL" value={clientName}
                                                onChange={(v: string) => setClientInfo(v.toUpperCase(), clientPhone, observations, dniCuit, condicionIva, ciudad, provincia, filename)} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <MobileField label="Localidad" placeholder="Ciudad..." value={ciudad}
                                                    onChange={(v: string) => setClientInfo(clientName, clientPhone, observations, dniCuit, condicionIva, v.toUpperCase(), provincia, filename)} />
                                                <MobileField label="Teléfono" placeholder="+54..." value={clientPhone} type="tel"
                                                    onChange={(v: string) => setClientInfo(clientName, v, observations, dniCuit, condicionIva, ciudad, provincia, filename)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <MobileField label="DNI / CUIT" placeholder="00-00000000-0" value={dniCuit}
                                                    onChange={(v: string) => setClientInfo(clientName, clientPhone, observations, v, condicionIva, ciudad, provincia, filename)} />
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Cond. IVA</label>
                                                    <select value={condicionIva} onChange={e => setClientInfo(clientName, clientPhone, observations, dniCuit, e.target.value, ciudad, provincia, filename)}
                                                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                                        {IVA_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <ActionBtn icon={Search} label="Buscar" active={isSearchOpen} onClick={() => setIsSearchOpen(true)} />
                                        <ActionBtn icon={PackagePlus} label="Manual" active={isManualOpen} onClick={() => setIsManualOpen(true)} />
                                        <ActionBtn icon={History} label="Historial" onClick={() => setShowHistory(true)} />
                                    </div>

                                    {/* PDF button */}
                                    <button onClick={handleDownloadPdf} disabled={items.length === 0}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-600 shadow-sm hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-30">
                                        <FileDown size={18} strokeWidth={2} />
                                        Imprimir / PDF
                                    </button>

                                    {/* Code input */}
                                    <form onSubmit={handleMobileCodeSubmit} className="flex gap-2">
                                        <input
                                            ref={codeInputRef}
                                            type="tel"
                                            value={mobileCode}
                                            onChange={e => setMobileCode(e.target.value.toUpperCase())}
                                            placeholder="Código de barras o producto..."
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300 placeholder:font-normal shadow-sm"
                                            autoComplete="off"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                        />
                                        <button type="submit"
                                            className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all active:scale-95 shadow-sm">
                                            ↵
                                        </button>
                                    </form>

                                    {/* Items card — mobile only */}
                                    <div className="lg:hidden">{itemsCard}</div>

                                    <div className="h-1" />
                                </div>
                            </div>

                            {/* Mobile footer */}
                            <div className="lg:hidden">{footerBar}</div>
                        </div>

                        {/* ── Right Panel ── items + footer (desktop only) ── */}
                        <div className="hidden lg:flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-4">
                                {itemsCard}
                            </div>
                            {footerBar}
                        </div>

                    </div>
                )}
            </div>

            {/* ── Modals ─────────────────────────────────────────── */}
            <AnimatePresence>
                {isSearchOpen && (
                    <SearchModal token={token} onClose={() => setIsSearchOpen(false)}
                        onSelect={(p: any, qty: number) => {
                            addItem({ productId: p.id, code: p.code, description: p.description, price: p.price, quantity: qty });
                            setIsSearchOpen(false);
                        }} />
                )}
                {isManualOpen && (
                    <ManualModal onClose={() => setIsManualOpen(false)}
                        onAdd={(d: string, p: number, q: number, vatRate: number) => { addItem({ description: d, price: p, quantity: q, vatRate }); setIsManualOpen(false); }} />
                )}
            </AnimatePresence>
        </div>
    );
}

function MobileField({ label, placeholder, value, onChange, type = 'text' }: any) {
    return (
        <div>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
    );
}

// ── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ historial, loading, currentId, toPedidoLoading, deleteLoading, onLoad, onToPedido, onDelete, onRefresh }: any) {
    return (
        <div className="h-full overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="font-black text-sm text-gray-800 uppercase tracking-widest">Historial</h2>
                    <button onClick={onRefresh} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                        Actualizar
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : historial.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                        <AlertCircle size={28} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm text-gray-400">No hay presupuestos guardados</p>
                    </div>
                ) : (
                    historial.map((h: HistorialItem) => (
                        <div key={h.id}
                            className={`bg-white rounded-2xl border shadow-sm transition-all
                                ${currentId === h.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-sm text-gray-800 truncate">
                                                {h.clienteNombre || 'CONSUMIDOR FINAL'}
                                            </p>
                                            {currentId === h.id && (
                                                <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">Editando</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Clock size={9} />
                                                {new Date(h.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </span>
                                            <span>{(h.items || []).length} ítem{(h.items || []).length !== 1 ? 's' : ''}</span>
                                            <span className="font-black text-gray-700">${Number(h.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <button onClick={() => onLoad(h)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-700 transition-colors uppercase tracking-wide">
                                        <ChevronRight size={13} /> Editar
                                    </button>
                                    <button onClick={() => onToPedido(h.id)}
                                        disabled={toPedidoLoading === h.id}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white text-[11px] font-black rounded-xl hover:bg-emerald-700 transition-colors uppercase tracking-wide disabled:opacity-50">
                                        {toPedidoLoading === h.id
                                            ? <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                            : <ShoppingCart size={13} />}
                                        Pedido
                                    </button>
                                    <button onClick={() => presupuestoApi.downloadPdf({
                                        clienteNombre: h.clienteNombre, clienteTelefono: h.clienteTelefono,
                                        dniCuit: h.dniCuit, condicionIva: h.condicionIva, ciudad: h.ciudad,
                                        provincia: h.provincia, observaciones: h.observaciones,
                                        items: (h.items || []).map((i: any) => ({ description: i.description, price: i.price, quantity: i.quantity })),
                                    })}
                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-100">
                                        <FileDown size={15} />
                                    </button>
                                    <button onClick={() => onDelete(h.id)} disabled={deleteLoading === h.id}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-gray-100 disabled:opacity-50">
                                        {deleteLoading === h.id
                                            ? <div className="w-3.5 h-3.5 border border-gray-300 border-t-red-500 rounded-full animate-spin" />
                                            : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div className="h-3" />
            </div>
        </div>
    );
}

// ── Overlay ──────────────────────────────────────────────────────────────────

function Overlay({ onClose, children }: any) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}>
            <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0, y: 8 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="w-full sm:w-auto"
                onClick={e => e.stopPropagation()}>
                {children}
            </motion.div>
        </motion.div>
    );
}

// ── Search Modal ─────────────────────────────────────────────────────────────

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
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">DESCRIPCIÓN</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">PRECIO</span>
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
                                className={`border-b border-gray-50 cursor-pointer transition-all select-none
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
                            <p className="text-xs text-gray-400 uppercase tracking-widest text-center px-4">
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

// ── Manual Modal ─────────────────────────────────────────────────────────────

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
