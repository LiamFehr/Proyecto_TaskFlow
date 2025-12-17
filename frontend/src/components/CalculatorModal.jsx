import { useState } from "react";
import PaymentOptionsDisplay from "./PaymentOptionsDisplay";

export default function CalculatorModal({ isOpen, onClose }) {
    const [price, setPrice] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">Calculadora de Cuotas</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingresa el monto a calcular:</label>
                    <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input
                            type="number"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                            value={price}
                            autoFocus
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    {price && Number(price) > 0 ? (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <PaymentOptionsDisplay price={Number(price)} />
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            Ingresa un valor para ver los planes
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
