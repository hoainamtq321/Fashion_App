import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../../../services/firebase";
import { createCustomerOrder, quoteCustomerOrder } from "../../orders/services/customerOrdersApi";
import { useCart } from "../hooks/useCart";
import styles from "./CartPage.module.css";

const formatPrice = (price) => `${Number(price || 0).toLocaleString("vi-VN")} ₫`;

const CartPage = () => {
    const { items, updateQuantity, removeFromCart, clearCart, cartCount, subtotal } = useCart();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState({
        name: auth.currentUser?.displayName || "",
        phone: "",
        address: "",
    });
    const [requestId] = useState(() => crypto.randomUUID());
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getOrderPayload = () => ({
        requestId,
        customer,
        paymentMethod: "Cash on delivery",
        items: items.map(({ id, color, size, quantity }) => ({
            productId: id,
            color,
            size,
            quantity,
        })),
    });

    const reviewOrder = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            setQuote(await quoteCustomerOrder(getOrderPayload()));
        } catch (quoteError) {
            setError(quoteError instanceof Error ? quoteError.message : "Could not review your order.");
            setQuote(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const placeOrder = async (event) => {
        event.preventDefault();
        if (!quote) return;
        setError("");
        setIsSubmitting(true);
        try {
            const order = await createCustomerOrder({ ...getOrderPayload(), expectedTotal: quote.total });
            clearCart();
            navigate(`/orders/${encodeURIComponent(order.id)}`, { replace: true });
        } catch (orderError) {
            setError(orderError instanceof Error ? orderError.message : "Could not place your order.");
            setQuote(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateCustomer = (field, value) => {
        setCustomer((current) => ({ ...current, [field]: value }));
        setQuote(null);
    };

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <p className={styles.eyebrow}>Your selections</p>
                <h1>Shopping bag</h1>
                <span>{cartCount} {cartCount === 1 ? "piece" : "pieces"}</span>
            </div>

            {items.length === 0 ? (
                <div className={styles.empty}>
                    <h2>Your bag is waiting.</h2>
                    <p>Discover considered pieces for the season ahead.</p>
                    <Link className={styles.continueLink} to="/">Continue shopping <span aria-hidden="true">↗</span></Link>
                </div>
            ) : (
                <div className={styles.layout}>
                    <div className={styles.items}>
                        {items.map((item) => (
                            <article className={styles.item} key={JSON.stringify([item.id, item.color, item.size])}>
                                <Link to={`/products/${item.id}`} className={styles.imageLink}>
                                    <img src={item.image} alt={item.name} />
                                </Link>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemTopline}>
                                        <div>
                                            <p className={styles.category}>{item.category}</p>
                                            <h2>{item.name}</h2>
                                        </div>
                                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                                    </div>
                                    <p className={styles.meta}>Color: {item.color} / Size: {item.size}</p>
                                    <div className={styles.itemActions}>
                                        <div className={styles.quantity}>
                                            <button type="button" disabled={isSubmitting} onClick={() => { updateQuantity(item.id, item.size, item.color, item.quantity - 1); setQuote(null); }} aria-label={`Decrease quantity of ${item.name}`}>−</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" disabled={isSubmitting} onClick={() => { updateQuantity(item.id, item.size, item.color, item.quantity + 1); setQuote(null); }} aria-label={`Increase quantity of ${item.name}`}>+</button>
                                        </div>
                                        <button className={styles.removeButton} type="button" disabled={isSubmitting} onClick={() => { removeFromCart(item.id, item.size, item.color); setQuote(null); }}>Remove</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className={styles.summary}>
                        <h2>Summary</h2>
                        <div><span>Subtotal estimate</span><strong>{formatPrice(subtotal)}</strong></div>
                        <div><span>Shipping</span><span>Complimentary</span></div>
                        {quote && <div className={styles.total}><span>Confirmed total</span><strong>{formatPrice(quote.total)}</strong></div>}
                        <form className={styles.checkoutForm} onSubmit={quote ? placeOrder : reviewOrder}>
                            <h3>{quote ? "Review your order" : "Delivery details"}</h3>
                            {!quote ? (
                                <>
                                    <label>Full name<input required maxLength="120" value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} /></label>
                                    <label>Phone<input required type="tel" maxLength="24" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} /></label>
                                    <label>Delivery address<textarea required maxLength="500" rows="3" value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} /></label>
                                </>
                            ) : (
                                <>
                                    <p className={styles.checkoutNote}>Prices and availability have been checked. Pay by cash on delivery.</p>
                                    <p className={styles.checkoutNote}>
                                        Deliver to {customer.name}, {customer.phone}, {customer.address}
                                    </p>
                                    <ul className={styles.quoteItems}>
                                        {quote.items.map((item, index) => (
                                            <li key={`${item.productId}-${item.color}-${item.size}-${index}`}>
                                                <span>{item.name} · {item.color} / {item.size} × {item.quantity}</span>
                                                <strong>{formatPrice(item.price * item.quantity)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className={styles.quoteTotal}><span>Total due on delivery</span><strong>{formatPrice(quote.total)}</strong></div>
                                    <button className={styles.secondaryCheckoutButton} type="button" onClick={() => setQuote(null)} disabled={isSubmitting}>Edit delivery details</button>
                                </>
                            )}
                            {error && <p className={styles.checkoutError} role="alert">{error}</p>}
                            <button className={styles.checkoutButton} type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Please wait…" : quote ? "Place COD order" : "Review COD order"}
                            </button>
                        </form>
                        <Link className={styles.continueLink} to="/">Continue shopping <span aria-hidden="true">↗</span></Link>
                    </aside>
                </div>
            )}
        </section>
    );
};

export default CartPage;
