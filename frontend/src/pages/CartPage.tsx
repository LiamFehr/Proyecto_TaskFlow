import { useState } from "react";
import { useCartStore } from "../store/cartStore";
import CartList from "../components/CartList";
import PaymentSummary from "../components/PaymentSummary";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CheckCircle, X, Trash2 } from "lucide-react";
import { http } from "../api/http";
import { Pedido } from "../types";

export default function CartPage() {
    const items = useCartStore((s) => s.items);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const clear = useCartStore((s) => s.clear);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientName, setClientName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);

    const handleCloseCart = () => {
        setIsModalOpen(true);
    };

    const handleSubmitOrder = async () => {
        if (!clientName.trim()) return;

        setIsSubmitting(true);
        try {
            const pedido: Pedido = {
                cliente: clientName,
                fecha: new Date().toISOString(),
                productos: items.map(item => ({
                    codigo: item.code,
                    descripcion: item.description,
                    cantidad: item.qty
                }))
            };

            await http.post("/pedidos", pedido);

            setSuccessMessage("Tu pedido fue enviado con éxito");
            clear();
            setIsModalOpen(false);
            setClientName("");

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (error) {
            console.error("Error sending order:", error);
            alert("Hubo un error al enviar el pedido. Por favor intente nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 && !successMessage) {
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
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
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
                    </div>
                </main>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="text-green-500 w-16 h-16" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido Enviado!</h2>
                    <p className="text-gray-600 mb-6">{successMessage}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                    >
                        <ArrowLeft size={20} />
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        );
    }

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
                <div className="max-w-4xl mx-auto space-y-6">
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

                    <button
                        onClick={handleCloseCart}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                    >
                        Cerrar Carrito
                    </button>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Finalizar Pedido</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                                Ingrese su nombre
                            </label>
                            <input
                                type="text"
                                id="clientName"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder="Ej: Juan Perez"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleSubmitOrder}
                            disabled={!clientName.trim() || isSubmitting}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Pedido"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
