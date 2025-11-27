import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "../api/products";

export function useProductSearch(text: string, page = 0, size = 20) {
    return useQuery({
        queryKey: ["products-search", text, page],
        queryFn: () => searchProducts(text, page, size),
        enabled: text.length > 0
    });
}
