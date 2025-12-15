import { create } from "zustand";

export const useCarritoStore = create((set) => ({
    items: [],

    agregarItem: (producto) =>
        set((state) => ({
            items: [...state.items, producto]
        })),

    vaciar: () => set({ items: [] }),
}));
