import { useState } from "react";

export function useScanner() {
    const [isOpen, setOpen] = useState(false);
    const [codigo, setCodigo] = useState(null);

    const abrir = () => setOpen(true);
    const cerrar = () => {
        setOpen(false);
        setCodigo(null);
    };

    return { isOpen, abrir, cerrar, codigo, setCodigo };
}
