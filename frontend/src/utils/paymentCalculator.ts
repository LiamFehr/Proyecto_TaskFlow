export function calculatePayments(total: number) {
    // const isWeekend = () => {
    //     const day = new Date().getDay();
    //     return day === 5 || day === 6; // Friday = 5, Saturday = 6
    // };

    return {
        efectivo: total * 0.90, // 10% discount
        transfer: total, // Same as debit, no discount
        debit: total,
        cuotas3: total / 3,
        naranja8: total / 8, // Always 8 installments
    };
}
