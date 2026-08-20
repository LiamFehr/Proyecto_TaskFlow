import React from 'react';
import { CreditCard, Banknote, Landmark, Smartphone, MoreHorizontal } from 'lucide-react';
import { PaymentMethod } from '../types/payment';

interface Props {
    methods: PaymentMethod[];
    selectedId?: number;
    onSelect: (method: PaymentMethod) => void;
}

const iconMap: Record<string, any> = {
    CASH: Banknote,
    DEBIT: CreditCard,
    CREDIT: CreditCard,
    TRANSFER: Landmark,
    WAITING_PAYMENT: Smartphone,
};

export const PaymentMethodSelector: React.FC<Props> = ({ methods, selectedId, onSelect }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {methods.map((method) => {
                const Icon = iconMap[method.type] || MoreHorizontal;
                const isSelected = selectedId === method.id;
                
                return (
                    <button
                        key={method.id}
                        onClick={() => onSelect(method)}
                        className={`
                            relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300
                            ${isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100 scale-[1.02]' 
                                : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }
                        `}
                    >
                        <div className={`p-2 rounded-xl mb-2 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <Icon size={20} />
                        </div>
                        <span className={`text-xs font-bold text-center ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            {method.name}
                        </span>
                        
                        {method.adjustmentValue !== 0 && (
                            <span className={`text-[10px] absolute top-2 right-2 px-1.5 py-0.5 rounded-full font-bold
                                ${method.adjustmentType?.includes('discount') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {method.adjustmentType?.includes('surcharge') ? '+' : '-'}{method.adjustmentValue}%
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
