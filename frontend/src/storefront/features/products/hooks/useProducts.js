import { useEffect, useState } from "react";
import { fakeProducts } from "../../../../shared/data/mockProducts";
import { toCatalogProduct } from "../utils/toCatalogProduct";
import { fetchProducts as requestProducts } from "../services/productsApi";

export const useProducts = () => {
    const [products, setProducts] = useState(fakeProducts);

    useEffect(() => {
        let isCurrent = true;

        const fetchProducts = async () => {
            try {
                const result = await requestProducts();

                if (isCurrent) {
                    setProducts(result.map(toCatalogProduct));
                }
            } catch (error) {
                console.error("[getProducts] Gọi API thất bại:", error);
            }
        };

        fetchProducts();

        return () => {
            isCurrent = false;
        };
    }, []);

    return products;
};
