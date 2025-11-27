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
                    className="flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all duration-200"
                >
                    <div className="flex items-center gap-3 flex-1">
                        <Package className="text-blue-600" size={24} />
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.description}</h3>
                            <p className="text-sm text-gray-500 font-mono">{item.code}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Cantidad</p>
                            <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                                <button
                                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.qty - 1))}
                                    className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded-md shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                                        className="w-12 text-center bg-transparent font-bold text-gray-800 outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => handleQuantityClick(item)}
                                        className="w-12 text-center font-bold text-gray-800 cursor-pointer hover:text-blue-600"
                                    >
                                        {item.qty}
                                    </span>
                                )}

                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.qty + 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">Precio Unit.</p>
                            <span className="font-semibold text-gray-700">${item.price.toFixed(2)}</span>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">Subtotal</p>
                            <span className="font-bold text-green-600 text-xl">
                                ${(item.price * item.qty).toFixed(2)}
                            </span>
                        </div>

                        <button
                            onClick={() => onRemove(item.id)}
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-110"
                            title="Eliminar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
