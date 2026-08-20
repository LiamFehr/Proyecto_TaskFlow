import React, { useState, useRef, useEffect } from "react";
import { 
    Search, X, CreditCard, Landmark, Plus, QrCode, 
    Banknote, Wallet, BadgeDollarSign 
} from "lucide-react";
import { http } from "../utils/request";
import { useAuthStore } from "../store/authStore";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { useCartStore } from "../store/cartStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import QRScanner from "../components/scanner/QRScanner";
import { Product } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
    'CASH': Banknote,
    'CARD': CreditCard,
    'TRANSFER': Landmark,
    'WALLET': Wallet,
    'CUSTOM': BadgeDollarSign,
    // Compatibility names
    Banknote,
    CreditCard,
    Landmark,
    Wallet,
    BadgeDollarSign,
};

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [product, setProduct] = useState<Product | null>(null);
    const [orderUuid, setOrderUuid] = useState("");
    const [loading, setLoading] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const token = useAuthStore((state) => state.token);
    const { methods } = usePaymentMethods();
    const addItem = useCartStore((s) => s.addItem);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = query.trim().toUpperCase();
        if (!trimmed || loading) return;

        setLoading(true);
        try {
            const res = await http.get(`/products/v1/search-exact?q=${trimmed}`, token);
            if (res && res.code) {
                setProduct({
                    ...res,
                    barcode: res.barcode || '',
                    price: res.price || 0,
                    finalPrice: res.price || 0,
                    hidden: res.hidden ?? false,
                    searchable: res.searchable ?? true,
                    description: res.description || res.name || '',
                    marca: res.marca || ''
                });
                setOrderUuid(crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 11) + Date.now().toString(36));
                setQuery("");
                setIsQRScannerOpen(false);
            } else {
                toast.error("Producto no encontrado");
                setProduct(null);
            }
        } catch (err) {
            console.error(err);
            toast.error("Producto no encontrado");
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    const handleQRDetected = async (decoded: string) => {
        setQuery(decoded);
        // We can't call handleSearch directly because query state update is async, 
        // but we can pass the decoded string to a search function.
        await searchWithCode(decoded);
    };

    const searchWithCode = async (codeStr: string) => {
        const trimmed = codeStr.trim().toUpperCase();
        if (!trimmed || loading) return;

        setLoading(true);
        try {
            const res = await http.get(`/products/v1/search-exact?q=${trimmed}`, token);
            if (res && res.code) {
                setProduct({
                    ...res,
                    barcode: res.barcode || '',
                    price: res.price || 0,
                    finalPrice: res.price || 0,
                    hidden: res.hidden ?? false,
                    searchable: res.searchable ?? true,
                    description: res.description || res.name || '',
                    marca: res.marca || ''
                });
                setOrderUuid(crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 11) + Date.now().toString(36));
                setQuery("");
                setIsQRScannerOpen(false);
            } else {
                toast.error("Producto no encontrado");
                setProduct(null);
            }
        } catch (err) {
            console.error(err);
            toast.error("Producto no encontrado");
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            addItem(product);
            toast.success("Agregado al carrito");
        }
    };


    const handleSelectMethod = async (m: any) => {
        if (!product || loading) return;
        
        setLoading(true);
        try {
            const uuid = orderUuid;
            const payload = {
                uuid,
                clienteNombre: "Cliente Web",
                items: [{
                    productoId: product.id,
                    cantidad: 1,
                    precioUnitario: product.price
                }],
                total: product.price,
                terminal: "WEB",
                notas: `Venta rápida - Método: ${m.name}`
            };

            await http.post('/pedidos/remotos', payload, token);
            toast.success(`Pedido enviado con éxito!`, {
                description: `Método: ${m.name}`
            });
            setProduct(null); // Clear search result
        } catch (err) {
            console.error(err);
            toast.error("Error al enviar el pedido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { inputRef.current?.focus(); }, []);

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col items-center py-10 px-4">
            {/* SEARCH BAR (ALWAYS VISIBLE) */}
            <div className="w-full max-w-4xl mb-12">
                <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <form onSubmit={handleSearch} className="flex flex-row items-center gap-2 sm:gap-4">
                        <div className="relative flex-1">
                            <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={22} />
                            </div>
                            <input
                                ref={inputRef}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Escribe el código..."
                                className="w-full h-14 sm:h-20 pl-12 sm:pl-16 pr-4 sm:pr-8 bg-slate-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-2xl sm:rounded-[1.8rem] text-sm sm:text-xl text-slate-800 transition-all outline-none placeholder:text-slate-300 font-bold"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="px-4 sm:px-10 h-14 sm:h-20 bg-blue-600 text-white font-black rounded-2xl sm:rounded-[1.8rem] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200"
                            disabled={loading}
                        >
                            <Search size={20} />
                            <span className="hidden sm:inline uppercase tracking-widest text-sm">Buscar</span>
                        </button>

                        <button 
                            type="button" 
                            onClick={() => setIsQRScannerOpen(true)}
                            className="px-4 sm:px-8 h-14 sm:h-20 bg-white border-2 border-slate-100 text-slate-500 font-black rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center gap-2 hover:text-blue-600 hover:border-blue-100 transition-all shadow-lg shadow-slate-100"
                        >
                            <QrCode size={24} />
                            <span className="hidden xs:inline uppercase tracking-widest text-sm">QR</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* RESULTS AREA */}
            <AnimatePresence>
                {product && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-lg space-y-4"
                    >
                        <div className="flex items-center justify-between px-4">
                             <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest">Resultados</h3>
                             <button onClick={() => setProduct(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                             </button>
                        </div>
                        {/* PRODUCT CARD (DESIGN BASED ON SCREENSHOT) */}
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-slate-300/40 border border-white">
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="space-y-3">
                                     <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                         {product.code}
                                     </div>
                                     <h2 className="text-2xl font-black text-slate-800 uppercase leading-[1.1] tracking-tight">{product.description}</h2>
                                </div>

                                {/* Price / Action */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                     <div className="space-y-0.5">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Precio Lista</p>
                                         <p className="text-4xl font-black text-emerald-600 tabular-nums">
                                             <span className="text-xl opacity-50 mr-1">$</span>
                                             {product.price.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                         </p>
                                     </div>
                                     <button 
                                        onClick={handleAddToCart}
                                        className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200"
                                     >
                                         <Plus size={28} strokeWidth={3} />
                                     </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                    {/* ERP Dynamic Methods */}
                                    {methods.map(m => {
                                        let finalAmt = product.price;

                                        if (m.adjustmentType === 'discount_percent') {
                                            finalAmt = product.price * (1 - (m.adjustmentValue || 0) / 100);
                                        } else if (m.adjustmentType === 'surcharge_percent') {
                                            finalAmt = product.price * (1 + (m.adjustmentValue || 0) / 100);
                                        } else if (m.adjustmentType === 'fixed_amount') {
                                            finalAmt = product.price + (m.adjustmentValue || 0);
                                        }

                                        const installmentAmt = (m.installmentsEnabled && m.installmentsQuantity) 
                                            ? finalAmt / m.installmentsQuantity 
                                            : null;

                                        const Icon = (m.iconKey && ICON_MAP[m.iconKey]) ? ICON_MAP[m.iconKey] : BadgeDollarSign;
                                        
                                        // Fallback gradients if ERP doesn't provide them
                                        const fallbackGradients: Record<string, string> = {
                                            'CASH': 'linear-gradient(135deg, #10b981, #059669)',
                                            'CARD': 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            'TRANSFER': 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                            'WALLET': 'linear-gradient(135deg, #fb923c, #f43f5e)',
                                        };

                                        const bgColor = m.background || fallbackGradients[m.type] || fallbackGradients['CASH'];
                                        const textColor = m.textColor || '#ffffff';

                                        return (
                                            <motion.div 
                                                key={m.id} 
                                                onClick={() => handleSelectMethod(m)}
                                                whileHover={{ scale: 1.02 }}
                                                className="cursor-pointer p-4 rounded-2xl space-y-3 shadow-lg transition-all h-full"
                                                style={{ background: bgColor, color: textColor }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center">
                                                        <Icon size={18} />
                                                    </div>
                                                    {m.adjustmentValue !== 0 && (
                                                        <div className="px-2 py-0.5 bg-black/20 rounded-md text-[8px] font-black uppercase tracking-widest">
                                                            {m.adjustmentType === 'discount_percent' ? `-${m.adjustmentValue}%` : `+${m.adjustmentValue}%`}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{m.name}</p>
                                                    <p className="text-2xl font-black tabular-nums">
                                                        {installmentAmt ? (
                                                            <>
                                                                <span className="text-xs mr-0.5">$</span>
                                                                {installmentAmt.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                                <span className="text-[10px] font-bold opacity-60 ml-1">/mes</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs mr-0.5">$</span>
                                                                {finalAmt.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isQRScannerOpen && (
                <QRScanner onDetect={handleQRDetected} onClose={() => setIsQRScannerOpen(false)} />
            )}
        </div>
    );
}
