import { auth } from "../../services/firebase";

const requestAdminApi = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in with an administrator account.");

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

const toAdminOrder = (order) => {
    const date = order.createdAt ? new Date(order.createdAt) : null;
    const dayKey = date && !Number.isNaN(date.getTime())
        ? `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
        : "UNKNOWN";
    return {
        ...order,
        number: `MSN-${dayKey}-${order.id.slice(0, 6).toUpperCase()}`,
        customerName: order.customer?.name || "",
        customer: order.customer?.name || "",
        date: date && !Number.isNaN(date.getTime())
            ? new Intl.DateTimeFormat("vi-VN").format(date)
            : "—",
        total: Number(order.total || 0),
        items: Array.isArray(order.items) ? order.items : [],
        itemCount: Array.isArray(order.items)
            ? order.items.reduce((total, item) => total + Number(item.quantity || 0), 0)
            : Number(order.itemCount || 0),
    };
};

export const getAdminOrders = async () => {
    const result = await requestAdminApi("/api/orders");
    if (!Array.isArray(result.data)) throw new Error("The orders API returned an invalid order list.");
    return result.data.map(toAdminOrder);
};

export const updateAdminOrder = async (orderId, order) => {
    const result = await requestAdminApi(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: JSON.stringify(order),
    });
    if (!result.data || typeof result.data !== "object") throw new Error("The orders API returned an invalid order.");
    return toAdminOrder(result.data);
};

export const updateAdminOrderStatus = async (orderId, status) => {
    const result = await requestAdminApi(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
    if (!result.data || typeof result.data !== "object") throw new Error("The orders API returned an invalid order.");
    return toAdminOrder(result.data);
};

export const updateAdminOrderPaymentStatus = async (orderId, paymentStatus) => {
    const result = await requestAdminApi(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
    });
    if (!result.data || typeof result.data !== "object") throw new Error("The orders API returned an invalid order.");
    return toAdminOrder(result.data);
};
