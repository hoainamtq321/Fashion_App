import { useEffect, useMemo, useState } from "react";
import { AdminDataContext } from "./AdminDataContext";
import { deleteAdminProduct, getAdminProducts, updateAdminProductStatus } from "../services/adminProductsApi";
import { getAdminOrders, updateAdminOrder, updateAdminOrderPaymentStatus, updateAdminOrderStatus } from "../services/adminOrdersApi";

const initialCategories = [
    { id: "cat_ao", label: "Áo" },
    { id: "cat_dam", label: "Đầm" },
    { id: "cat_quan", label: "Quần" },
    { id: "cat_phukien", label: "Phụ kiện" },
];

const normalizeCategoryLabel = (label) => label.trim().toLocaleLowerCase("vi");

const toCategorySlug = (label) => label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const AdminDataProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState(initialCategories);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState("");
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState("");

    useEffect(() => {
        let isCurrent = true;

        const loadProducts = async () => {
            try {
                const savedProducts = await getAdminProducts();
                if (!isCurrent) return;

                setProducts(savedProducts);
                setCategories((currentCategories) => {
                    const mergedCategories = [...currentCategories];
                    savedProducts.forEach((product) => {
                        if (!product.categoryId || mergedCategories.some(({ id }) => id === product.categoryId)) return;
                        mergedCategories.push({
                            id: product.categoryId,
                            label: product.category || product.categoryId,
                        });
                    });
                    return mergedCategories;
                });
                setProductsError("");
            } catch (error) {
                if (isCurrent) {
                    setProductsError(error instanceof Error ? error.message : "Could not load products.");
                }
            } finally {
                if (isCurrent) setIsLoadingProducts(false);
            }
        };

        loadProducts();
        return () => {
            isCurrent = false;
        };
    }, []);

    useEffect(() => {
        let isCurrent = true;
        const loadOrders = async () => {
            try {
                const savedOrders = await getAdminOrders();
                if (!isCurrent) return;
                setOrders(savedOrders);
                setOrdersError("");
            } catch (error) {
                if (isCurrent) {
                    setOrdersError(error instanceof Error ? error.message : "Could not load orders.");
                }
            } finally {
                if (isCurrent) setIsLoadingOrders(false);
            }
        };

        loadOrders();
        return () => {
            isCurrent = false;
        };
    }, []);

    const value = useMemo(() => ({
        products,
        orders,
        categories,
        isLoadingProducts,
        productsError,
        isLoadingOrders,
        ordersError,
        async retryOrders() {
            setIsLoadingOrders(true);
            setOrdersError("");
            try {
                const savedOrders = await getAdminOrders();
                setOrders(savedOrders);
            } catch (error) {
                setOrdersError(error instanceof Error ? error.message : "Could not load orders.");
            } finally {
                setIsLoadingOrders(false);
            }
        },
        setProducts,
        clearProductsError() {
            setProductsError("");
        },
        addCategory(label) {
            const normalizedLabel = normalizeCategoryLabel(label);
            const existingCategory = categories.find(({ label: categoryLabel }) => normalizeCategoryLabel(categoryLabel) === normalizedLabel);
            if (existingCategory) return { category: existingCategory, created: false };

            const baseId = `cat_${toCategorySlug(label) || "new"}`;
            let id = baseId;
            let suffix = 2;
            while (categories.some((category) => category.id === id)) {
                id = `${baseId}_${suffix}`;
                suffix += 1;
            }

            const category = { id, label: label.trim() };
            setCategories((currentCategories) => [...currentCategories, category]);
            return { category, created: true };
        },
        async deleteProduct(product) {
            if (!window.confirm(`Delete ${product.name}?`)) return;
            try {
                await deleteAdminProduct(product.id);
                setProducts((currentProducts) => currentProducts.filter(({ id }) => id !== product.id));
                setProductsError("");
            } catch (error) {
                setProductsError(error instanceof Error ? error.message : "Could not delete the product.");
            }
        },
        async toggleProductStatus(productId) {
            const product = products.find(({ id }) => id === productId);
            if (!product) return;
            try {
                const updatedProduct = await updateAdminProductStatus(productId, product.status);
                setProducts((currentProducts) => currentProducts.map((currentProduct) => currentProduct.id === productId ? updatedProduct : currentProduct));
                setProductsError("");
            } catch (error) {
                setProductsError(error instanceof Error ? error.message : "Could not update product status.");
            }
        },
        async updateOrderStatus(orderId, status) {
            const updatedOrder = await updateAdminOrderStatus(orderId, status);
            setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? updatedOrder : order));
            setOrdersError("");
            if (status === "Cancelled") {
                try {
                    const currentProducts = await getAdminProducts();
                    setProducts(currentProducts);
                    setProductsError("");
                } catch (error) {
                    setProductsError(error instanceof Error ? error.message : "The order was cancelled, but inventory could not be refreshed.");
                }
            }
            return updatedOrder;
        },
        async updateOrder(orderId, orderData) {
            const updatedOrder = await updateAdminOrder(orderId, orderData);
            setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? updatedOrder : order));
            setOrdersError("");
            try {
                const currentProducts = await getAdminProducts();
                setProducts(currentProducts);
                setProductsError("");
            } catch (error) {
                setProductsError(error instanceof Error ? error.message : "The order was updated, but inventory could not be refreshed.");
            }
            return updatedOrder;
        },
        async updateOrderPaymentStatus(orderId, paymentStatus) {
            const updatedOrder = await updateAdminOrderPaymentStatus(orderId, paymentStatus);
            setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? updatedOrder : order));
            setOrdersError("");
            return updatedOrder;
        },
    }), [products, orders, categories, isLoadingProducts, productsError, isLoadingOrders, ordersError]);

    return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};
