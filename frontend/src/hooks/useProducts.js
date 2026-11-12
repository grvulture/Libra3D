import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProduct } from "../api/products";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 60_000,
  });
}

export function useProduct(productId) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}
