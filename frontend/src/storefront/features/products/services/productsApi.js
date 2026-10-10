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
