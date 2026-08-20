import { 
    CreditCard, Landmark, Banknote, Wallet, BadgeDollarSign 
} from "lucide-react";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { motion } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
    'CASH': Banknote,
    'CARD': CreditCard,
    'TRANSFER': Landmark,
    'WALLET': Wallet,
    'CUSTOM': BadgeDollarSign,
    // Compatibility names
    Banknote,
    CreditCard,
    Landmark,
    Wallet,
    BadgeDollarSign,
};

interface PaymentSummaryProps {
    total: number;
}

export default function PaymentSummary({ total }: PaymentSummaryProps) {
    const { methods, loading } = usePaymentMethods();

    if (loading) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Medios de Pago</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {methods.map((m) => {
                    let finalAmt = total;

                    if (m.adjustmentType === 'discount_percent') {
                        finalAmt = total * (1 - (m.adjustmentValue || 0) / 100);
                    } else if (m.adjustmentType === 'surcharge_percent') {
                        finalAmt = total * (1 + (m.adjustmentValue || 0) / 100);
                    } else if (m.adjustmentType === 'fixed_amount') {
                        finalAmt = total + (m.adjustmentValue || 0);
                    }

                    const installmentAmt = (m.installmentsEnabled && m.installmentsQuantity) 
                        ? finalAmt / m.installmentsQuantity 
                        : null;

                    const Icon = (m.iconKey && ICON_MAP[m.iconKey]) ? ICON_MAP[m.iconKey] : BadgeDollarSign;
                    
                    const fallbackGradients: Record<string, string> = {
                        'CASH': 'linear-gradient(135deg, #10b981, #059669)',
                        'CARD': 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        'TRANSFER': 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        'WALLET': 'linear-gradient(135deg, #fb923c, #f43f5e)',
                    };

                    const bgColor = m.background || fallbackGradients[m.type] || fallbackGradients['CASH'];
                    const textColor = m.textColor || '#ffffff';

                    return (
                        <motion.div
                            key={m.id}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-xl p-4 shadow-md transition-all duration-200"
                            style={{ background: bgColor, color: textColor }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center">
                                        <Icon size={18} />
                                    </div>
                                    <span className="font-bold text-sm sm:text-base uppercase tracking-tight">
                                        {m.name}
                                    </span>
                                </div>
                                {m.adjustmentValue !== 0 && (
                                    <span className="bg-black/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0">
                                        {m.adjustmentType === 'discount_percent' ? `-${m.adjustmentValue}%` : `+${m.adjustmentValue}%`}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl sm:text-2xl font-black tabular-nums">
                                    ${(installmentAmt || finalAmt).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                </span>
                                {installmentAmt && (
                                    <span className="text-xs font-bold opacity-60">/mes</span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
