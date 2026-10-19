import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartContext";
const getStorageKey = (userId) => `maison-cart:${userId}`;

const readStoredCart = (userId) => {
    if (!userId) return [];
    try {
        const storedCart = window.localStorage.getItem(getStorageKey(userId));
        const parsedCart = storedCart ? JSON.parse(storedCart) : [];
        return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
        return [];
    }
};

const CartSession = ({ children, userId }) => {
    const [items, setItems] = useState(() => readStoredCart(userId));
    useEffect(() => {
        if (userId) window.localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
    }, [items, userId]);

    const addToCart = useCallback((product, size, quantity = 1) => {
        if (!userId) throw new Error("Please sign in before adding items to your bag.");
        setItems((currentItems) => {
            const existingItem = currentItems.find((item) => (
                item.id === product.id && item.color === product.color && item.size === size
            ));

            if (existingItem) {
                return currentItems.map((item) => (
                    item.id === product.id && item.color === product.color && item.size === size
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                ));
            }

            return [...currentItems, {
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                image: product.image,
                color: product.color,
                size,
                quantity,
            }];
        });
    }, [userId]);

    const updateQuantity = useCallback((itemId, size, color, quantity) => {
        if (quantity < 1) {
            setItems((currentItems) => currentItems.filter((item) => !(
                item.id === itemId && item.size === size && item.color === color
            )));
            return;
        }

        setItems((currentItems) => currentItems.map((item) => (
            item.id === itemId && item.size === size && item.color === color ? { ...item, quantity } : item
        )));
    }, []);

    const removeFromCart = useCallback((itemId, size, color) => {
        setItems((currentItems) => currentItems.filter((item) => !(
            item.id === itemId && item.size === size && item.color === color
        )));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);
    const cartCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const value = useMemo(() => ({
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        isAuthenticated: Boolean(userId),
    }), [items, addToCart, updateQuantity, removeFromCart, clearCart, cartCount, subtotal, userId]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const CartProvider = ({ children, user }) => (
    <CartSession key={user?.uid || "signed-out"} userId={user?.uid || null}>
        {children}
    </CartSession>
);
