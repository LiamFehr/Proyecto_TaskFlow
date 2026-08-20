import { useState, useEffect } from 'react';
import { http } from '../utils/request';
import { useAuthStore } from '../store/authStore';
import { PaymentMethod } from '../types/payment';

export function usePaymentMethods() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore(s => s.token);

    useEffect(() => {
        async function fetchMethods() {
            try {
                const res = await http.get('/v1/config/payment-methods', token);
                setMethods(res);
            } catch (err) {
                console.error("Error fetching payment methods:", err);
            } finally {
                setLoading(false);
            }
        }
        if (token) fetchMethods();
    }, [token]);

    return { methods, loading };
}
