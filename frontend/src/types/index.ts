export interface Product {
    id: number;
    code: string;
    barcode: string;
    name: string;
    description: string;
    finalPrice: number;
    price: number; // Keep for now to avoid immediate breakage
    stock: number;
    marca?: string;
    hidden: boolean;
    searchable: boolean;
}

export interface CartItem extends Product {
    qty: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
}

export interface ProductoPedido {
    codigo: string;
    descripcion: string;
    cantidad: number;
}

export interface Pedido {
    cliente: string;
    fecha: string;
    productos: ProductoPedido[];
}
