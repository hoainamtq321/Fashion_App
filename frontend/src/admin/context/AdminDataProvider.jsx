import { useEffect, useMemo, useState } from "react";
import { AdminDataContext } from "./AdminDataContext";
import { deleteAdminProduct, getAdminProducts, updateAdminProductStatus } from "../services/adminProductsApi";

const initialOrders = [
    { id: "#MSN-1048", customer: "Olivia Martin", date: "Sep 09, 2026", total: 334, items: 2, status: "Processing" },
    { id: "#MSN-1047", customer: "Amelia Stone", date: "Sep 08, 2026", total: 189, items: 1, status: "Shipped" },
    { id: "#MSN-1046", customer: "Nora Williams", date: "Sep 08, 2026", total: 263, items: 2, status: "Delivered" },
    { id: "#MSN-1045", customer: "Mia Anderson", date: "Sep 07, 2026", total: 145, items: 1, status: "Pending" },
    { id: "#MSN-1044", customer: "Ella Thompson", date: "Sep 06, 2026", total: 118, items: 1, status: "Delivered" },
];

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
    const [orders, setOrders] = useState(initialOrders);
    const [categories, setCategories] = useState(initialCategories);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState("");

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

    const value = useMemo(() => ({
        products,
        orders,
        categories,
        isLoadingProducts,
        productsError,
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
        updateOrderStatus(orderId, status) {
            setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? { ...order, status } : order));
        },
    }), [products, orders, categories, isLoadingProducts, productsError]);

    return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};
