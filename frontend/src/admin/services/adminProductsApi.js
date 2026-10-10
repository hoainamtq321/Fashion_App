import { auth } from "../../services/firebase";

const requestAdminApi = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Please sign in with an administrator account.");
    }

    const token = await user.getIdToken();
    const headers = new Headers(options.headers);
    headers.set("Authorization", ["Bearer", token].join(" "));
    if (options.body) headers.set("Content-Type", "application/json");

    const response = await fetch(url, { ...options, headers });
    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.message || `Request failed with status ${response.status}.`);
    }

    return result;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result !== "string") {
            reject(new Error("Could not read the selected image."));
            return;
        }
        resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
});

const toAdminProduct = (product) => ({
    ...product,
    category: product.category || product.categoryId,
    image: product.images?.[0] || product.variants?.find(({ image }) => image)?.image || "",
    stock: (product.variants || []).reduce((total, variant) => total + Number(variant.stock || 0), 0),
    status: product.status === "draft" ? "Draft" : "Active",
});

export const getAdminProducts = async () => {
    const result = await requestAdminApi("/api/products?all=true");
    if (!Array.isArray(result.data)) {
        throw new Error("The products API returned an invalid product list.");
    }
    return result.data.map(toAdminProduct);
};

export const createAdminProduct = async (product) => {
    const result = await requestAdminApi("/api/products", {
        method: "POST",
        body: JSON.stringify(product),
    });
    return toAdminProduct(result.data);
};

export const updateAdminProduct = async (productId, product) => {
    const result = await requestAdminApi(`/api/products?id=${encodeURIComponent(productId)}`, {
        method: "PUT",
        body: JSON.stringify(product),
    });
    return toAdminProduct(result.data);
};

export const deleteAdminProduct = async (productId) => {
    await requestAdminApi(`/api/products?id=${encodeURIComponent(productId)}`, { method: "DELETE" });
};

export const updateAdminProductStatus = async (productId, status) => {
    const result = await requestAdminApi(`/api/products?id=${encodeURIComponent(productId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: status === "Active" ? "draft" : "active" }),
    });
    return toAdminProduct(result.data);
};

export const uploadProductImage = async (file) => {
    const image = await readFileAsDataUrl(file);
    const result = await requestAdminApi("/api/upload-image", {
        method: "POST",
        body: JSON.stringify({ image, name: file.name }),
    });

    if (typeof result.data?.url !== "string" || !result.data.url.startsWith("https://")) {
        throw new Error("The image upload service returned an invalid image URL.");
    }

    return result.data.url;
};
