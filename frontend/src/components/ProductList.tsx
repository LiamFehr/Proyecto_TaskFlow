import { Product } from "../types";
import { Plus } from "lucide-react";
import PaymentOptionsDisplay from "./PaymentOptionsDisplay";

interface ProductListProps {
    products: Product[];
    onSelect: (product: Product) => void;
}

export default function ProductList({ products, onSelect }: ProductListProps) {

    const handleAction = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(product);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-8">
            {products.map((p) => (
                <div
                    key={p.id}
                    className="bg-white border-2 border-slate-100 rounded-xl md:rounded-[2rem] p-3 md:p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group"
                >
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
                        {/* LEFT COLUMN: Product Info & Main Action */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                {/* Badge */}
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg mb-4 md:mb-6">
                                    <span className="font-mono text-xs md:text-sm font-bold text-blue-600">
                                        {p.code}
                                    </span>
                                </div>

                                {/* Name/Title */}
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-blue-700 transition-colors">
                                    {p.name || p.description}
                                </h3>
                                {p.description && p.name && (
                                    <p className="text-sm text-slate-500 mb-2 truncate max-w-md">{p.description}</p>
                                )}
                                {p.barcode && (
                                    <p className="text-sm text-slate-400 font-mono truncate">{p.barcode}</p>
                                )}
                            </div>

                            {/* Price & Button */}
                            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Lista</p>
                                    <p className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tight">
                                        ${(p.finalPrice || p.price).toLocaleString('es-AR')}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => handleAction(p, e)}
                                    className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg bg-slate-900 text-white hover:bg-blue-600 hover:scale-105"
                                    title="Agregar al carrito"
                                >
                                    <Plus strokeWidth={3} size={24} className="md:w-7 md:h-7" />
                                </button>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Payment Options (Always Visible) */}
                        <div className="lg:w-[480px] shrink-0 bg-slate-50/30 rounded-xl md:rounded-2xl p-1 md:p-3 border border-slate-100/50 mt-2 lg:mt-0">
                            {/* Desktop: standard, Mobile: standard logic (not dense) but 2 columns */}
                            <div className="hidden md:block">
                                <PaymentOptionsDisplay price={p.finalPrice || p.price} showTitle={false} columns={2} />
                            </div>
                            <div className="block md:hidden">
                                {/* Using columns=2 and dense=false to make them larger but fit 2 per row side-by-edges */}
                                <PaymentOptionsDisplay price={p.finalPrice || p.price} showTitle={false} columns={2} dense={false} mobileConfig={true} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
