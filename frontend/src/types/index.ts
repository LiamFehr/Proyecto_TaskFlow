export interface Product {
    id: number;
    code: string;
    barcode: string;
    description: string;
    price: number;
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
