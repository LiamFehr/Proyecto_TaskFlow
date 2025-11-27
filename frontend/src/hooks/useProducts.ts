import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/products";

export function useProducts(page = 0, size = 20) {
    return useQuery({
        queryKey: ["products", page],
        queryFn: () => getProducts(page, size)
    });
}
