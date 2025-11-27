import { create } from "zustand";
import { Product, CartItem } from "../types";

interface CartStore {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, qty: number) => void;
    clear: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
    items: [],
    addItem: (product: Product) =>
        set((state) => {
            const existing = state.items.find((i) => i.id === product.id);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
                    )
                };
            }
            return {
                items: [...state.items, { ...product, qty: 1 }]
            };
        }),
    removeItem: (id: number) =>
        set((state) => ({
            items: state.items.filter((i) => i.id !== id)
        })),
    updateQuantity: (id: number, qty: number) =>
        set((state) => ({
            items: state.items.map((i) =>
                i.id === id ? { ...i, qty: Math.max(1, qty) } : i
            )
        })),
    clear: () => set({ items: [] })
}));
