import { create } from "zustand";

interface PresupuestoItem {
    id: string; // unique ID
    productId?: number; // if catalog item
    description: string;
    price: number;
    quantity: number;
}

interface PresupuestoStore {
    items: PresupuestoItem[];
    clientName: string;
    clientPhone: string;
    observations: string; // Address
    dniCuit: string;
    condicionIva: string;
    ciudad: string;
    provincia: string;
    filename: string;

    addItem: (item: Omit<PresupuestoItem, "id">) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    setClientInfo: (name: string, phone: string, obs: string, dni: string, iva: string, city: string, prov: string, fname: string) => void;
    clear: () => void;
}

export const usePresupuestoStore = create<PresupuestoStore>((set) => ({
    items: [],
    clientName: "",
    clientPhone: "",
    observations: "", // Will be used as Address
    dniCuit: "",
    condicionIva: "Consumidor Final",
    ciudad: "Paraná",
    provincia: "Entre Ríos",
    filename: "",

    addItem: (item) => set((state) => {
        // Check if item exists (only for catalog products with productId)
        if (item.productId) {
            const existingItemIndex = state.items.findIndex(i => i.productId === item.productId);
            if (existingItemIndex !== -1) {
                const updatedItems = [...state.items];
                updatedItems[existingItemIndex].quantity += item.quantity;
                return { items: updatedItems };
            }
        }

        // New item
        const id = Math.random().toString(36).substr(2, 9);
        return { items: [...state.items, { ...item, id }] };
    }),

    removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
    })),

    updateQuantity: (id, qty) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, quantity: qty } : i)
    })),

    setClientInfo: (name, phone, obs, dni, iva, city, prov, fname) => set({
        clientName: name,
        clientPhone: phone,
        observations: obs,
        dniCuit: dni,
        condicionIva: iva,
        ciudad: city,
        provincia: prov,
        filename: fname
    }),

    clear: () => set({
        items: [],
        clientName: "",
        clientPhone: "",
        observations: "",
        dniCuit: "",
        condicionIva: "Consumidor Final",
        ciudad: "Paraná",
        provincia: "Entre Ríos",
        filename: ""
    })
}));
