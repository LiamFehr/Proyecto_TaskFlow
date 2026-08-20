export interface PaymentMethod {
    id: number;
    erpId: number;
    name: string;
    type: string;
    iconKey: string;
    adjustmentType: 'none' | 'discount_percent' | 'surcharge_percent' | 'fixed_amount';
    adjustmentValue: number;
    active: boolean;
    displayOrder: number;
    background?: string;
    textColor?: string;
    installmentsEnabled?: boolean;
    installmentsQuantity?: number;
    interestPercent?: number;
}
