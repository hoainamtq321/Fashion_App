import { auth } from "../../../../services/firebase";

const requestCustomerOrders = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in to manage your orders.");

    const token = await user.getIdToken();
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body) headers.set("Content-Type", "application/json");

    const response = await fetch(url, { ...options, headers });
    const result = await response.json();
    if (!response.ok || result.success === false) {
        const error = new Error(result.message || `Request failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }
    return result;
};

export const getCustomerOrders = async () => {
    const result = await requestCustomerOrders("/api/orders");
    if (!Array.isArray(result.data)) throw new Error("The orders API returned an invalid order list.");
    return result.data;
};

export const getCustomerOrder = async (orderId) => {
    const result = await requestCustomerOrders(`/api/orders?id=${encodeURIComponent(orderId)}`);
    if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
        throw new Error("The orders API returned an invalid order.");
    }
    return result.data;
};

export const createCustomerOrder = async (order) => {
    const result = await requestCustomerOrders("/api/orders", {
        method: "POST",
        body: JSON.stringify(order),
    });
    if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
        throw new Error("The orders API returned an invalid order.");
    }
    return result.data;
};

export const quoteCustomerOrder = async (order) => {
    const result = await requestCustomerOrders("/api/orders?quote=true", {
        method: "POST",
        body: JSON.stringify(order),
    });
    if (!result.data || !Array.isArray(result.data.items) || !Number.isSafeInteger(result.data.total)) {
        throw new Error("The orders API returned an invalid order quote.");
    }
    return result.data;
};
