export function calculatePayments(total: number) {
    const isWeekend = () => {
        const day = new Date().getDay();
        return day === 5 || day === 6; // Friday = 5, Saturday = 6
    };

    return {
        efectivo: total * 0.90, // 10% discount
        transfer: total, // Same as debit, no discount
        debit: total,
        cuotas3: total / 3,
        naranja5: total / (total > 200000 ? 8 : 5), // 8 installments if >200k, else 5
        bancoEntreRios: total / 6, // Always available for display
    };
}
