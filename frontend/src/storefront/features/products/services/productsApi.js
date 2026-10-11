export const fetchProducts = async () => {
    const response = await fetch("/api/products");
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
    }

    if (!Array.isArray(result.data)) {
        throw new Error("API trả về danh sách sản phẩm không hợp lệ.");
    }

    return result.data;
};

export const fetchProductById = async (productId) => {
    const response = await fetch(`/api/products?id=${encodeURIComponent(productId)}`);
    const result = await response.json();

    if (!response.ok) {
        const error = new Error(result.message || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }

    if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
        throw new Error("API trả về dữ liệu sản phẩm không hợp lệ.");
    }

    return result.data;
};
