import { calculatePayments } from "../utils/paymentCalculator";
import { Banknote, CreditCard, Landmark, Receipt } from "lucide-react";

interface PaymentSummaryProps {
    total: number;
}

export default function PaymentSummary({ total }: PaymentSummaryProps) {
    const pay = calculatePayments(total);
    const naranjaInstallments = total > 200000 ? 8 : 5;

    const methods: {
        icon: any;
        name: string;
        discount: string | null;
        amount: number;
        color: string;
        perMonth?: boolean;
    }[] = [
            { icon: Banknote, name: "Efectivo", discount: "-10%", amount: pay.efectivo, color: "green" },
            { icon: Landmark, name: "Transferencia", discount: null, amount: pay.transfer, color: "blue" },
            { icon: CreditCard, name: "Débito", discount: null, amount: pay.debit, color: "purple" },
            { icon: CreditCard, name: "3 Cuotas s/interés", discount: null, amount: pay.cuotas3, color: "indigo", perMonth: true },
            {
                icon: CreditCard,
                name: `Naranja ${naranjaInstallments} Cuotas`,
                discount: null,
                amount: pay.naranja5,
                color: "orange",
                perMonth: true
            },
        ];

    // Add Banco Entre Ríos (always visible now per user request)
    methods.push({
        icon: CreditCard,
        name: "Banco Entre Ríos 6 Cuotas",
        discount: "Solo Vie/Sáb",
        amount: pay.bancoEntreRios || total / 6, // Fallback calculation if null
        color: "red",
        perMonth: true
    });

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Medios de Pago</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {methods.map((method, idx) => {
                    const Icon = method.icon;
                    const colorClasses = {
                        green: "from-green-500 to-emerald-600",
                        blue: "from-blue-500 to-cyan-600",
                        purple: "from-purple-500 to-pink-600",
                        indigo: "from-indigo-500 to-violet-600",
                        orange: "from-orange-500 to-amber-600",
                        red: "from-red-500 to-rose-600",
                        teal: "from-teal-500 to-cyan-600",
                    }[method.color] || "from-gray-500 to-gray-600";

                    return (
                        <div
                            key={idx}
                            className={`bg-gradient-to-br ${colorClasses} text-white rounded-xl p-4 hover:shadow-xl transition-all duration-200 hover:scale-105`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon size={20} />
                                    <span className="font-semibold">{method.name}</span>
                                </div>
                                {method.discount && (
                                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                                        {method.discount}
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl font-bold">
                                ${method.amount.toFixed(2)}
                                {method.perMonth && (
                                    <span className="text-sm font-normal ml-1 opacity-90">/mes</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
