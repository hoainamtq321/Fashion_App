import { useEffect, useState } from "react";
import { toCatalogProduct } from "../utils/toCatalogProduct";
import { fetchProducts as requestProducts } from "../services/productsApi";

export const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await requestProducts();

                if (isCurrent) {
                    setProducts(result.map(toCatalogProduct));
                }
            } catch (error) {
                console.error("[getProducts] Gọi API thất bại:", error);
                if (isCurrent) {
                    setError(error);
                }
            } finally {
                if (isCurrent) {
                    setIsLoading(false);
                }
            }
        };

        fetchProducts();

        return () => {
            isCurrent = false;
        };
    }, [attempt]);

    const retry = () => {
        setIsLoading(true);
        setError(null);
        setAttempt((currentAttempt) => currentAttempt + 1);
    };

    return { products, isLoading, error, retry };
};
