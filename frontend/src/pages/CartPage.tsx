import { useCartStore } from "../store/cartStore";
import CartList from "../components/CartList";
import PaymentSummary from "../components/PaymentSummary";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";

export default function CartPage() {
    const items = useCartStore((s) => s.items);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const clear = useCartStore((s) => s.clear);

    const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <img src="/vhp-logo.jpg" alt="VHP Logo" className="h-20 w-auto object-contain" />
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="text-blue-600" size={24} />
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Carrito de Compras
                                </h1>
                            </div>
                        </div>
                        {items.length > 0 && (
                            <button
                                onClick={clear}
                                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200"
                            >
                                <Trash2 size={18} />
                                Vaciar Carrito
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {items.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Tu carrito está vacío
                            </h2>
                            <p className="text-gray-500 mb-6">
                                Agrega algunos productos para comenzar
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
                            >
                                Ir a Productos
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Items List */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    Artículos ({items.reduce((acc, item) => acc + item.qty, 0)})
                                </h2>
                                <CartList
                                    items={items}
                                    onRemove={removeItem}
                                    onUpdateQuantity={updateQuantity}
                                />
                            </div>

                            {/* Total */}
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-semibold">Total:</span>
                                    <span className="text-4xl font-bold">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <PaymentSummary total={total} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
