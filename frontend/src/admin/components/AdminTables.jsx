import { Link } from "react-router-dom";
import { getOrderStatusClass, ORDER_STATUS_TRANSITIONS } from "../../../lib/orderStatusCatalog";
import styles from "./AdminShared.module.css";

const statusClass = (status) => status.toLowerCase().replace(" ", "-");

export const ProductTable = ({ products, onToggleStatus, onEdit, onDelete }) => (
    <div className={styles.tableWrap}>
        <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
                {products.map((product) => (
                    <tr key={product.id}>
                        <td>
                            <Link className={styles.productLink} to={`/admin/products/${product.id}`}>
                                <div className={styles.productCell}><img src={product.image} alt="" /><strong>{product.name}</strong></div>
                            </Link>
                        </td>
                        <td className={styles.muted}>{product.sku}</td>
                        <td className={styles.muted}>{product.category}</td>
                        <td>${product.price}</td>
                        <td><span className={product.stock < 15 ? styles.lowStock : ""}>{product.stock} units</span></td>
                        <td><span className={`${styles.status} ${styles[statusClass(product.status)]}`}>{product.status}</span></td>
                        <td>
                            <div className={styles.productActions}>
                                <button className={styles.actionButton} type="button" onClick={() => onEdit(product)}>Edit</button>
                                <button className={`${styles.actionButton} ${styles.deleteButton}`} type="button" onClick={() => onDelete(product)}>Delete</button>
                                <button className={styles.moreButton} type="button" onClick={() => onToggleStatus(product.id)} title="Toggle product status">•••</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {products.length === 0 && <div className={styles.noResults}>No products match this search.</div>}
    </div>
);

export const OrderTable = ({
    orders,
    onStatusChange,
    compact = false,
    hasOrders = orders.length > 0,
    emptyMessage = hasOrders ? "No orders match this search." : "No orders yet.",
}) => (
    <div className={styles.tableWrap}>
        <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>{!compact && <th />}</tr></thead>
            <tbody>
                {orders.map((order) => (
                    <tr key={order.id}>
                        <td>
                            {compact
                                ? <strong>{order.number || order.id}</strong>
                                : <Link className={styles.orderLink} to={`/admin/orders/${order.id}`}><strong>{order.number || order.id}</strong></Link>}
                            <small className={styles.itemCount}>{order.itemCount ?? 0} {(order.itemCount ?? 0) === 1 ? "item" : "items"}</small>
                        </td>
                        <td className={styles.muted}>{order.customer}</td>
                        <td className={styles.muted}>{order.date}</td>
                        <td>{Number(order.total || 0).toLocaleString("vi-VN")} ₫</td>
                        <td>
                            <select
                                className={`${styles.statusSelect} ${styles[getOrderStatusClass(order.status)]}`}
                                value={order.status}
                                onChange={(event) => onStatusChange(order.id, event.target.value)}
                                aria-label={`Status for ${order.id}`}
                                disabled={(ORDER_STATUS_TRANSITIONS[order.status] || []).length === 0}
                            >
                                <option value={order.status}>{order.status}</option>
                                {(ORDER_STATUS_TRANSITIONS[order.status] || []).map((status) => <option key={status}>{status}</option>)}
                            </select>
                        </td>
                        {!compact && <td><Link className={styles.moreButton} to={`/admin/orders/${order.id}`} aria-label={`View order ${order.id}`}>•••</Link></td>}
                    </tr>
                ))}
            </tbody>
        </table>
        {orders.length === 0 && (
            <div className={styles.orderEmptyState}>
                <strong>{emptyMessage}</strong>
            </div>
        )}
    </div>
);
