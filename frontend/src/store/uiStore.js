import { create } from "zustand";

export const useUIStore = create((set) => ({
    scannerAbierto: false,

    abrirScanner: () => set({ scannerAbierto: true }),
    cerrarScanner: () => set({ scannerAbierto: false }),
}));
