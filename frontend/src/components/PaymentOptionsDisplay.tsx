import { calculatePayments } from "../utils/paymentCalculator";
import { Banknote, CreditCard, Landmark } from "lucide-react";
import { cn } from "../lib/utils";

interface PaymentOptionsDisplayProps {
    price: number;
    showTitle?: boolean;
    columns?: 1 | 2;
    dense?: boolean;
    mobileConfig?: boolean;
}

export default function PaymentOptionsDisplay({ price, showTitle = true, columns = 2, dense = false, mobileConfig = false }: PaymentOptionsDisplayProps) {
    const pay = calculatePayments(price);
    const naranjaInstallments = price > 200000 ? 8 : 5;

    const methods = [
        {
            icon: Banknote,
            name: "Efectivo",
            discount: "-10%",
            amount: pay.efectivo,
            color: "green",
            gradient: "from-green-500 to-emerald-600"
        },
        {
            icon: Landmark,
            name: "Transferencia",
            discount: null,
            amount: pay.transfer,
            color: "blue",
            gradient: "from-blue-500 to-cyan-600"
        },
        {
            icon: CreditCard,
            name: "Débito",
            discount: null,
            amount: pay.debit,
            color: "purple",
            gradient: "from-purple-500 to-pink-600"
        },
        {
            icon: CreditCard,
            name: "3 Cuotas s/interés",
            discount: null,
            amount: pay.cuotas3,
            color: "indigo",
            gradient: "from-indigo-500 to-violet-600",
            perMonth: true
        },
        {
            icon: CreditCard,
            name: `Naranja ${naranjaInstallments} Cuotas`,
            discount: null,
            amount: pay.naranja5,
            color: "orange",
            gradient: "from-orange-500 to-amber-600",
            perMonth: true
        },
        {
            icon: CreditCard,
            name: "Banco Entre Ríos 6 Cuotas",
            discount: "Solo Vie/Sáb",
            amount: pay.bancoEntreRios || price / 6,
            color: "red",
            gradient: "from-red-500 to-rose-600",
            perMonth: true
        }
    ];

    return (
        <div className="w-full">
            {showTitle && <h3 className="text-xl font-bold text-gray-800 mb-6">Medios de Pago</h3>}

            <div className={cn(
                "grid transition-all",
                (mobileConfig || dense) ? "gap-2" : "gap-3",
                columns === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
                {methods.map((method, idx) => {
                    const Icon = method.icon;
                    // Determine styling based on mode
                    let paddingClass = "p-4 min-h-[90px]";
                    let textSize = "text-sm md:text-base";
                    let amountSize = "text-xl md:text-2xl";
                    let iconSize = 20;

                    if (dense) {
                        paddingClass = "p-2 min-h-[70px]";
                        textSize = "text-xs";
                        amountSize = "text-sm sm:text-base";
                        iconSize = 14;
                    } else if (mobileConfig) {
                        // Mobile Config: Larger and bolder for better readability on phones
                        paddingClass = "p-4 min-h-[95px]"; // Increased padding and height
                        textSize = "text-xs sm:text-sm font-bold"; // Bolder text
                        amountSize = "text-xl sm:text-2xl"; // Larger price
                        iconSize = 20; // Larger icon
                    }

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "bg-gradient-to-br text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform cursor-default flex flex-col justify-between",
                                method.gradient,
                                paddingClass
                            )}
                        >
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <Icon size={iconSize} className="opacity-90 shrink-0" />
                                    <span className={cn("font-bold shadow-sm leading-tight truncate", textSize)}>
                                        {method.name.replace(" Cuotas", "")}
                                        {(dense || mobileConfig) && method.name.includes("Cuotas") && <span className="hidden sm:inline"> Cuotas</span>}
                                        {(!dense && !mobileConfig) && method.name.includes("Cuotas") && " Cuotas"}
                                    </span>
                                </div>
                                {method.discount && (
                                    <span className={cn("bg-white/20 rounded-full font-bold backdrop-blur-sm shrink-0",
                                        dense ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] md:text-xs"
                                    )}>
                                        {method.discount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1 mt-auto">
                                <span className={cn("font-bold tracking-tight", amountSize)}>
                                    ${method.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {method.perMonth && (
                                    <span className={cn("font-medium opacity-80", (dense || mobileConfig) ? "text-[10px]" : "text-xs")}>/mes</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
