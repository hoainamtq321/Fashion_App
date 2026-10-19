import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCustomerOrder } from "../services/customerOrdersApi";
import styles from "./CustomerOrders.module.css";

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeStyle: "short" }).format(date) : "—";
};

const CustomerOrderDetailPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [loadedOrderId, setLoadedOrderId] = useState(null);
    const isLoading = loadedOrderId !== orderId;
    const [attempt, setAttempt] = useState(0);
    const retry = () => {
        setError("");
        setLoadedOrderId(null);
        setAttempt((value) => value + 1);
    };

    useEffect(() => {
        let isCurrent = true;
        getCustomerOrder(orderId)
            .then((result) => {
                if (isCurrent) {
                    setOrder(result);
                    setError("");
                    setLoadedOrderId(orderId);
                }
            })
            .catch((loadError) => {
                if (isCurrent) {
                    setError(loadError instanceof Error ? loadError.message : "Could not load this order.");
                    setLoadedOrderId(orderId);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [orderId, attempt]);

    if (isLoading) return <section className={styles.page} role="status">Loading order…</section>;
    if (error) {
        return (
            <section className={styles.page}>
                <p className={styles.message} role="alert">{error}</p>
                <button className={styles.button} type="button" onClick={retry}>Try again</button>
                <Link className={styles.detailLink} to="/orders">Back to my orders</Link>
            </section>
        );
    }
    if (!order) return null;

    return (
        <section className={styles.page}>
            <Link className={styles.detailLink} to="/orders">← Back to my orders</Link>
            <p className={styles.eyebrow}>Order details</p>
            <div className={styles.orderHeading}>
                <h1 className={styles.title}>{order.id}</h1>
                <span className={styles.status}>{order.status || "Pending"}</span>
            </div>
            <p className={styles.message}>Placed {formatDate(order.createdAt)}</p>
            <div className={styles.detailGrid}>
                <section className={styles.orderCard}>
                    <h2>Delivery and payment</h2>
                    <dl>
                        <div><dt>Name</dt><dd>{order.customer?.name || "—"}</dd></div>
                        <div><dt>Phone</dt><dd>{order.customer?.phone || "—"}</dd></div>
                        <div><dt>Address</dt><dd>{order.customer?.address || "—"}</dd></div>
                        <div><dt>Method</dt><dd>{order.paymentMethod || "Cash on delivery"}</dd></div>
                        <div><dt>Payment status</dt><dd>{order.paymentStatus || "Unpaid"}</dd></div>
                    </dl>
                </section>
                <section className={styles.orderCard}>
                    <h2>Items</h2>
                    <div className={styles.items}>
                        {(order.items || []).map((item, index) => (
                            <article className={styles.item} key={`${item.productId}-${item.color}-${item.size}-${index}`}>
                                {item.image && <img src={item.image} alt="" />}
                                <div>
                                    <strong>{item.name}</strong>
                                    <p>{item.color} / {item.size} · Qty {item.quantity}</p>
                                </div>
                                <span>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                            </article>
                        ))}
                    </div>
                    <dl className={styles.total}>
                        <div><dt>Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
                        <div><dt>Shipping</dt><dd>{Number(order.shippingFee || 0) ? formatCurrency(order.shippingFee) : "Complimentary"}</dd></div>
                        <div><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
                    </dl>
                </section>
            </div>
        </section>
    );
};

export default CustomerOrderDetailPage;
