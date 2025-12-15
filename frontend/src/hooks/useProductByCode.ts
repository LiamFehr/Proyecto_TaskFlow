import { useQuery } from "@tanstack/react-query";
import { getProductByCode } from "../api/products";

export function useProductByCode(code: string) {
    return useQuery({
        queryKey: ["product-code", code],
        queryFn: () => getProductByCode(code),
        enabled: code.length > 0,
        retry: false
    });
}
