import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "../api/products";

export function useSearchProducts(query: string) {
    return useQuery({
        queryKey: ["products-search", query],
        queryFn: () => searchProducts(query),
        enabled: query.length > 0,
        retry: false
    });
}
