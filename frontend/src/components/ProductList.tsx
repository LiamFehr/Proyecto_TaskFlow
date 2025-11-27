import { Product } from "../types";
import { Plus, Package } from "lucide-react";

interface ProductListProps {
    products: Product[];
    onSelect: (product: Product) => void;
}

export default function ProductList({ products, onSelect }: ProductListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
                <div
                    key={p.id}
                    className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-xl transition-all duration-200 cursor-pointer group"
                    onClick={() => onSelect(p)}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="text-blue-600" size={20} />
                                <span className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    {p.code}
                                </span>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                                {p.description}
                            </h3>
                            {p.barcode && (
                                <p className="text-xs text-gray-500 font-mono">
                                    Código de barras: {p.barcode}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-2xl font-bold text-green-600">
                                ${p.price.toFixed(2)}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(p);
                                }}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:shadow-lg transition-all duration-200 group-hover:scale-110"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
