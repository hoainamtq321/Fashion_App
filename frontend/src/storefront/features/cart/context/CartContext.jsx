import { useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartContext";
const storageKey = "maison-cart";

const readStoredCart = () => {
    try {
        const storedCart = window.localStorage.getItem(storageKey);
        return storedCart ? JSON.parse(storedCart) : [];
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(readStoredCart);

    useEffect(() => {
        window.localStorage.setItem(storageKey, JSON.stringify(items));
    }, [items]);

    const addToCart = (product, size, quantity = 1) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find((item) => item.id === product.id && item.size === size);

            if (existingItem) {
                return currentItems.map((item) => (
                    item.id === product.id && item.size === size
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
    };

    const updateQuantity = (itemId, size, quantity) => {
        if (quantity < 1) {
            setItems((currentItems) => currentItems.filter((item) => !(item.id === itemId && item.size === size)));
            return;
        }

        setItems((currentItems) => currentItems.map((item) => (
            item.id === itemId && item.size === size ? { ...item, quantity } : item
        )));
    };

    const removeFromCart = (itemId, size) => {
        setItems((currentItems) => currentItems.filter((item) => !(item.id === itemId && item.size === size)));
    };

    const cartCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const value = useMemo(() => ({ items, addToCart, updateQuantity, removeFromCart, cartCount, subtotal }), [items, cartCount, subtotal]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
