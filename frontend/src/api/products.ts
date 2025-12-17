import { http } from "./http";
import { Product } from "../types";

export const getProductByCode = async (code: string): Promise<Product> => {
    const res = await http.get(`/products/code/${code}`);
    return res.data;
};

export const searchProducts = async (query: string): Promise<Product[]> => {
    const res = await http.get(`/vendedor/productos?search=${query}`);
    return res.data;
};
