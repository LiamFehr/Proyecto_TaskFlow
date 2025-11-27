import { http } from "./http";
import { Product, PageResponse } from "../types";

export const getProducts = async (page = 0, size = 20): Promise<PageResponse<Product>> => {
    const res = await http.get("/products", { params: { page, size } });
    return res.data;
};

export const searchProducts = async (text: string, page = 0, size = 20): Promise<PageResponse<Product>> => {
    const res = await http.get("/products/search", { params: { q: text, page, size } });
    return res.data;
};

export const getProductById = async (id: number): Promise<Product> => {
    const res = await http.get(`/products/${id}`);
    return res.data;
};
