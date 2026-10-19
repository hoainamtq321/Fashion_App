import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminData } from "../../context/AdminDataContext";
import { getOrderStatusClass, ORDER_STATUS_TRANSITIONS } from "../../../../lib/orderStatusCatalog";
import AdminOrderForm from "./AdminOrderForm";
import styles from "../../components/AdminShared.module.css";

const AdminOrderDetailPage = () => {
    const { orderId } = useParams();
    const { orders, isLoadingOrders, ordersError, retryOrders, updateOrderStatus, updateOrderPaymentStatus } = useAdminData();
    const [statusError, setStatusError] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const order = orders.find(({ id }) => id === orderId);

    const changeStatus = async (event) => {
        const nextStatus = event.target.value;
        setStatusError("");
        setIsUpdating(true);
        try {
            await updateOrderStatus(order.id, nextStatus);
        } catch (error) {
            setStatusError(error instanceof Error ? error.message : "Could not update order status.");
        } finally {
            setIsUpdating(false);
        }
    };

    const changePaymentStatus = async (event) => {
        const nextPaymentStatus = event.target.value;
        setStatusError("");
        setIsUpdatingPayment(true);
        try {
            await updateOrderPaymentStatus(order.id, nextPaymentStatus);
        } catch (error) {
            setStatusError(error instanceof Error ? error.message : "Could not update payment status.");
        } finally {
            setIsUpdatingPayment(false);
        }
    };

    const cancelOrder = async () => {
        if (!window.confirm("Cancel this order and return its reserved items to inventory?")) return;
        setStatusError("");
        setIsUpdating(true);
        try {
            await updateOrderStatus(order.id, "Cancelled");
        } catch (error) {
            setStatusError(error instanceof Error ? error.message : "Could not cancel order.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoadingOrders) return <p className={styles.muted} role="status" aria-busy="true">Loading order…</p>;
    if (ordersError) {
        return (
            <section className={styles.orderDetail}>
                <p className={styles.formMessage} role="alert">{ordersError}</p>
                <button className={styles.secondaryButton} type="button" onClick={retryOrders}>Try again</button>
                <Link className={styles.backLink} to="/admin/orders">Back to orders</Link>
            </section>
        );
    }
    if (!order) {
        return (
            <section className={styles.orderDetail}>
                <p className={styles.panelEyebrow}>Sales activity</p>
                <h2 className={styles.detailTitle}>Order not found</h2>
                <Link className={styles.backLink} to="/admin/orders">Back to orders</Link>
            </section>
        );
    }

    if (isEditing) {
        return (
            <section className={styles.orderDetail}>
                <AdminOrderForm
                    initialOrder={order}
                    onCancel={() => setIsEditing(false)}
                    onSaved={() => setIsEditing(false)}
                />
            </section>
        );
    }

    const availableStatuses = ORDER_STATUS_TRANSITIONS[order.status] || [];
    const paymentStatus = order.paymentStatus || "Unpaid";
    const canEdit = ["Pending", "Processing"].includes(order.status) && paymentStatus === "Unpaid";
    const canCancel = availableStatuses.includes("Cancelled") && paymentStatus !== "Paid";
    return (
        <section className={styles.orderDetail}>
            <div className={styles.detailToolbar}>
                <Link className={styles.backLink} to="/admin/orders">← Back to orders</Link>
                {canEdit && <button className={styles.secondaryButton} type="button" onClick={() => setIsEditing(true)}>Edit order</button>}
                {canCancel && <button className={styles.cancelButton} type="button" onClick={cancelOrder} disabled={isUpdating}>Cancel order</button>}
                <button className={styles.secondaryButton} type="button" onClick={() => window.print()}>Print order</button>
            </div>
            <div className={styles.orderDetailHeader}>
                <div>
                    <p className={styles.panelEyebrow}>Order</p>
                    <h2 className={styles.detailTitle}>{order.number || order.id}</h2>
                    <p className={styles.muted}>Created {order.date} · Source: {order.source || "admin"}</p>
                </div>
                <div className={styles.orderStatusControl}>
                    <span className={`${styles.status} ${styles[getOrderStatusClass(order.status)]}`}>{order.status}</span>
                    <label>
                        Fulfillment status
                        <select value={order.status} onChange={changeStatus} disabled={isUpdating || availableStatuses.length === 0}>
                            <option value={order.status}>{order.status}</option>
                            {availableStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                    </label>
                </div>
            </div>
            {statusError && <p className={styles.formMessage} role="alert">{statusError}</p>}

            <div className={styles.orderDetailGrid}>
                <section className={`${styles.panel} ${styles.orderCustomerPanel}`}>
                    <h3 className={styles.detailSectionTitle}>Customer and delivery</h3>
                    <dl className={styles.detailInfo}>
                        <div><dt>Name</dt><dd>{order.customer?.name || "—"}</dd></div>
                        <div><dt>Phone</dt><dd>{order.customer?.phone || "—"}</dd></div>
                        <div><dt>Address</dt><dd>{order.customer?.address || "—"}</dd></div>
                        {order.customerId && <div><dt>Account ID</dt><dd>{order.customerId}</dd></div>}
                    </dl>
                    <div className={styles.orderPaymentInfo}>
                        <span>Payment status</span>
                        <select
                            value={paymentStatus}
                            onChange={changePaymentStatus}
                            disabled={isUpdatingPayment || paymentStatus === "Refunded" || order.status === "Cancelled"}
                            aria-label="Payment status"
                        >
                            <option value={paymentStatus}>{paymentStatus}</option>
                            {paymentStatus === "Unpaid" && <option value="Paid">Paid</option>}
                            {paymentStatus === "Paid" && <option value="Refunded">Refunded</option>}
                        </select>
                        <small>{order.paymentMethod || "Payment method not recorded"}</small>
                    </div>
                </section>

                <section className={`${styles.panel} ${styles.orderItemsPanel}`}>
                    <h3 className={styles.detailSectionTitle}>Items</h3>
                    <div className={styles.tableWrap}>
                        <table>
                            <thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead>
                            <tbody>
                                {(order.items || []).map((item, index) => (
                                    <tr key={`${item.productId}-${item.color}-${item.size}-${index}`}>
                                        <td><strong>{item.name}</strong>{item.sku && <small className={styles.itemCount}>{item.sku}</small>}</td>
                                        <td>{item.color} / {item.size}</td>
                                        <td>{item.quantity}</td>
                                        <td>{Number(item.price || 0).toLocaleString("vi-VN")} ₫</td>
                                        <td>{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString("vi-VN")} ₫</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <dl className={styles.orderTotals}>
                        <div><dt>Subtotal</dt><dd>{Number(order.subtotal || 0).toLocaleString("vi-VN")} ₫</dd></div>
                        <div><dt>Shipping</dt><dd>{Number(order.shippingFee || 0) ? `${Number(order.shippingFee).toLocaleString("vi-VN")} ₫` : "Complimentary"}</dd></div>
                        {Number(order.discount || 0) > 0 && <div><dt>Discount</dt><dd>−{Number(order.discount).toLocaleString("vi-VN")} ₫</dd></div>}
                        <div className={styles.orderGrandTotal}><dt>Total</dt><dd>{Number(order.total || 0).toLocaleString("vi-VN")} ₫</dd></div>
                    </dl>
                </section>
            </div>
        </section>
    );
};

export default AdminOrderDetailPage;
