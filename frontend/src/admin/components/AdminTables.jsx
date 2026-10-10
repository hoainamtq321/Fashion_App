import styles from "./AdminShared.module.css";

const statusClass = (status) => status.toLowerCase().replace(" ", "-");

export const ProductTable = ({ products, onToggleStatus, onEdit, onDelete }) => (
    <div className={styles.tableWrap}>
        <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
                {products.map((product) => (
                    <tr key={product.id}>
                        <td><div className={styles.productCell}><img src={product.image} alt="" /><strong>{product.name}</strong></div></td>
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

export const OrderTable = ({ orders, onStatusChange, compact = false }) => (
    <div className={styles.tableWrap}>
        <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>{!compact && <th />}</tr></thead>
            <tbody>
                {orders.map((order) => (
                    <tr key={order.id}>
                        <td><strong>{order.id}</strong><small className={styles.itemCount}>{order.items} {order.items === 1 ? "item" : "items"}</small></td>
                        <td className={styles.muted}>{order.customer}</td>
                        <td className={styles.muted}>{order.date}</td>
                        <td>${order.total.toFixed(2)}</td>
                        <td>
                            <select
                                className={`${styles.statusSelect} ${styles[statusClass(order.status)]}`}
                                value={order.status}
                                onChange={(event) => onStatusChange(order.id, event.target.value)}
                                aria-label={`Status for ${order.id}`}
                            >
                                <option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option>
                            </select>
                        </td>
                        {!compact && <td><button className={styles.moreButton} type="button" title="View order">•••</button></td>}
                    </tr>
                ))}
            </tbody>
        </table>
        {orders.length === 0 && <div className={styles.noResults}>No orders match this search.</div>}
    </div>
);
