import { useState, useEffect } from "react";
import { Banknote, CreditCard, Landmark, Smartphone, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { PaymentMethod } from "../types/payment";
import { apiBase } from "../utils/request";
import { useAuthStore } from "../store/authStore";

interface PaymentOptionsDisplayProps {
    price: number;
    showTitle?: boolean;
    columns?: 1 | 2;
    dense?: boolean;
    mobileConfig?: boolean;
}

const iconMap: Record<string, any> = {
    CASH: Banknote,
    DEBIT: CreditCard,
    CREDIT: CreditCard,
    TRANSFER: Landmark,
    WAITING_PAYMENT: Smartphone,
};

const gradientMap: Record<string, string> = {
    CASH: "from-emerald-500 to-teal-600",
    DEBIT: "from-sky-500 to-blue-600",
    CREDIT: "from-orange-500 to-amber-600",
    TRANSFER: "from-indigo-500 to-violet-700",
    WAITING_PAYMENT: "from-slate-600 to-slate-800",
};

export default function PaymentOptionsDisplay({ price, showTitle = true, columns = 2, dense = false, mobileConfig = false }: PaymentOptionsDisplayProps) {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore(state => state.token);

    useEffect(() => {
        const fetchMethods = async () => {
            try {
                // Si estamos en desarrollo/local y no hay token, podemos usar fetch directo o http util
                const res = await fetch(`${apiBase}/config/payment-methods`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMethods(data);
                }
            } catch (err) {
                console.error("Error fetching payment methods:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMethods();
    }, [token]);

    const calculateAmount = (base: number, method: PaymentMethod) => {
        if (!method.adjustmentValue) return base;
        
        let finalPrice = base;
        if (method.adjustmentType === 'discount_percent') {
            finalPrice = base * (1 - (method.adjustmentValue / 100));
        } else if (method.adjustmentType === 'surcharge_percent') {
            finalPrice = base * (1 + (method.adjustmentValue / 100));
        } else if (method.adjustmentType === 'fixed_amount') {
            finalPrice = base + method.adjustmentValue;
        }
        return finalPrice;
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-400">Cargando planes...</div>;
    }

    if (methods.length === 0) {
        return <div className="p-10 text-center text-gray-400">No hay medios de pago configurados.</div>;
    }

    return (
        <div className="w-full">
            {showTitle && <h3 className="text-xl font-bold text-gray-800 mb-6">Medios de Pago</h3>}

            <div className={cn(
                "grid transition-all",
                (mobileConfig || dense) ? "gap-2" : "gap-3",
                columns === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
                {methods.map((method) => {
                    const Icon = iconMap[method.type] || MoreHorizontal;
                    const finalAmount = calculateAmount(price, method);
                    const gradient = method.background || gradientMap[method.type] || "from-gray-400 to-gray-500";
                    
                    // Determine labels for discount/surcharge
                    let badgeLabel = null;
                    if (method.adjustmentType === 'discount_percent') badgeLabel = `-${method.adjustmentValue}%`;
                    else if (method.adjustmentType === 'surcharge_percent') badgeLabel = `+${method.adjustmentValue}%`;

                    // Styling logic
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
                        paddingClass = "p-4 min-h-[95px]";
                        textSize = "text-xs sm:text-sm font-bold";
                        amountSize = "text-xl sm:text-2xl";
                        iconSize = 20;
                    }

                    return (
                        <div
                            key={method.id}
                            className={cn(
                                "bg-gradient-to-br text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform cursor-default flex flex-col justify-between",
                                gradient.startsWith('from-') ? gradient : `from-${gradient}-500 to-${gradient}-600`,
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
                                {badgeLabel && (
                                    <span className={cn("bg-white/20 rounded-full font-bold backdrop-blur-sm shrink-0",
                                        dense ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] md:text-xs"
                                    )}>
                                        {badgeLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1 mt-auto">
                                <span className={cn("font-bold tracking-tight", amountSize)}>
                                    ${finalAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                                {(method.installmentsEnabled && method.installmentsQuantity) && (
                                    <span className={cn("font-medium opacity-80", (dense || mobileConfig) ? "text-[10px]" : "text-xs")}>
                                        en {method.installmentsQuantity}x ${ (finalAmount / method.installmentsQuantity).toLocaleString('es-AR', { maximumFractionDigits: 0 }) }
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
