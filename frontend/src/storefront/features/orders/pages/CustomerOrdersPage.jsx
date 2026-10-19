import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerOrders } from "../services/customerOrdersApi";
import styles from "./CustomerOrders.module.css";

const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("vi-VN").format(date) : "—";
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const CustomerOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        getCustomerOrders()
            .then((result) => {
                if (isCurrent) setOrders(result);
            })
            .catch((loadError) => {
                if (isCurrent) setError(loadError instanceof Error ? loadError.message : "Could not load your orders.");
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [attempt]);

    const retry = () => {
        setIsLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    };

    return (
        <section className={styles.page}>
            <p className={styles.eyebrow}>Your account</p>
            <h1 className={styles.title}>My orders</h1>
            {isLoading && <p className={styles.message} role="status">Loading your orders…</p>}
            {error && (
                <div className={styles.message} role="alert">
                    <p>{error}</p>
                    <button className={styles.button} type="button" onClick={retry}>Try again</button>
                </div>
            )}
            {!isLoading && !error && orders.length === 0 && (
                <div className={styles.empty}>
                    <h2>No orders yet</h2>
                    <p>Your confirmed purchases will appear here.</p>
                    <Link className={styles.button} to="/">Explore products</Link>
                </div>
            )}
            {!isLoading && !error && orders.length > 0 && (
                <div className={styles.orderList}>
                    {orders.map((order) => (
                        <article className={styles.orderCard} key={order.id}>
                            <div className={styles.orderHeading}>
                                <div>
                                    <span className={styles.label}>Order</span>
                                    <h2>{order.id}</h2>
                                </div>
                                <span className={styles.status}>{order.status || "Pending"}</span>
                            </div>
                            <dl>
                                <div><dt>Placed</dt><dd>{formatDate(order.createdAt)}</dd></div>
                                <div><dt>Items</dt><dd>{(order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)}</dd></div>
                                <div><dt>Payment</dt><dd>{order.paymentMethod || "Cash on delivery"} · {order.paymentStatus || "Unpaid"}</dd></div>
                                <div><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
                            </dl>
                            <Link className={styles.detailLink} to={`/orders/${encodeURIComponent(order.id)}`}>View order details →</Link>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default CustomerOrdersPage;
