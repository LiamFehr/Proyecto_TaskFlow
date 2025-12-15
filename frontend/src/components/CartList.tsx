import { CartItem } from "../types";
import { X, Package, Plus } from "lucide-react";
import { useState } from "react";

interface CartListProps {
    items: CartItem[];
    onRemove: (id: number) => void;
    onUpdateQuantity: (id: number, qty: number) => void;
}

export default function CartList({ items, onRemove, onUpdateQuantity }: CartListProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const handleQuantityClick = (item: CartItem) => {
        setEditingId(item.id);
        setEditValue(item.qty.toString());
    };

    const handleQuantityBlur = (id: number) => {
        const qty = parseInt(editValue);
        if (!isNaN(qty) && qty > 0) {
            onUpdateQuantity(id, qty);
        }
        setEditingId(null);
    };

    const handleQuantityKeyPress = (e: React.KeyboardEvent, id: number) => {
        if (e.key === "Enter") {
            handleQuantityBlur(id);
        }
    };

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="bg-white border-2 border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                    {/* Container: Stack on mobile, Row on Desktop */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">

                        {/* 1. Product Info (Always top/left) */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                                <Package className="text-blue-600" size={20} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight">
                                    {item.description}
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-1">{item.code}</p>
                            </div>
                        </div>

                        {/* 2. Controls & Pricing (Bottom on mobile, Right on Desktop) */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-6 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0 w-full sm:w-auto">

                            {/* Quantity */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 sm:hidden">
                                    Cant.
                                </span>
                                <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.qty - 1))}
                                        className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded shadow-sm hover:bg-slate-100 disabled:opacity-50"
                                        disabled={item.qty <= 1}
                                    >
                                        -
                                    </button>

                                    {editingId === item.id ? (
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => handleQuantityBlur(item.id)}
                                            onKeyPress={(e) => handleQuantityKeyPress(e, item.id)}
                                            className="w-8 text-center bg-transparent font-bold text-sm text-slate-800 outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <span
                                            onClick={() => handleQuantityClick(item)}
                                            className="w-8 text-center font-bold text-sm text-slate-800 cursor-pointer"
                                        >
                                            {item.qty}
                                        </span>
                                    )}

                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.qty + 1)}
                                        className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 active:scale-95"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Subtotal */}
                            <div className="flex flex-col items-end sm:items-center min-w-[30%] sm:min-w-0">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 sm:hidden">
                                    Total
                                </span>
                                <div className="flex flex-col items-end sm:items-center">
                                    <span className="font-black text-emerald-600 text-base sm:text-lg">
                                        ${(item.price * item.qty).toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 hidden sm:block">
                                        Unit: ${item.price.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => onRemove(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors ml-1 sm:ml-0"
                                title="Eliminar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
