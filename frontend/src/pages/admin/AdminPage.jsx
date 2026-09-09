import { useMemo, useState } from "react";
import { fakeProducts } from "../../components/Products/productData";
import styles from "./AdminPage.module.css";

const initialProducts = fakeProducts.map((product, index) => ({
    ...product,
    sku: `MSN-${String(index + 101).padStart(3, "0")}`,
    stock: [24, 8, 36, 12][index],
    status: index === 1 ? "Draft" : "Active",
}));

const initialOrders = [
    { id: "#MSN-1048", customer: "Olivia Martin", date: "Sep 09, 2026", total: 334, items: 2, status: "Processing" },
    { id: "#MSN-1047", customer: "Amelia Stone", date: "Sep 08, 2026", total: 189, items: 1, status: "Shipped" },
    { id: "#MSN-1046", customer: "Nora Williams", date: "Sep 08, 2026", total: 263, items: 2, status: "Delivered" },
    { id: "#MSN-1045", customer: "Mia Anderson", date: "Sep 07, 2026", total: 145, items: 1, status: "Pending" },
    { id: "#MSN-1044", customer: "Ella Thompson", date: "Sep 06, 2026", total: 118, items: 1, status: "Delivered" },
];

const statusClass = (status) => status.toLowerCase().replace(" ", "-");

const AdminPage = () => {
    const [activeSection, setActiveSection] = useState("Overview");
    const [products, setProducts] = useState(initialProducts);
    const [orders, setOrders] = useState(initialOrders);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All status");
    const [isModalOpen, setModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", category: "Outerwear", price: "", stock: "" });

    const filteredProducts = useMemo(() => products.filter((product) => {
        const matchesSearch = `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (statusFilter === "All status" || product.status === statusFilter);
    }), [products, search, statusFilter]);

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const matchesSearch = `${order.id} ${order.customer}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (statusFilter === "All status" || order.status === statusFilter);
    }), [orders, search, statusFilter]);

    const selectSection = (section) => {
        setActiveSection(section);
        setSearch("");
        setStatusFilter("All status");
    };

    const addProduct = (event) => {
        event.preventDefault();
        setProducts((currentProducts) => [{
            id: `new-${Date.now()}`,
            name: newProduct.name,
            category: newProduct.category,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock),
            sku: `MSN-${String(currentProducts.length + 101).padStart(3, "0")}`,
            status: "Active",
            image: fakeProducts[0].image,
        }, ...currentProducts]);
        setNewProduct({ name: "", category: "Outerwear", price: "", stock: "" });
        setModalOpen(false);
    };

    const toggleProductStatus = (productId) => {
        setProducts((currentProducts) => currentProducts.map((product) => product.id === productId
            ? { ...product, status: product.status === "Active" ? "Draft" : "Active" }
            : product));
    };

    const updateOrderStatus = (orderId, status) => {
        setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? { ...order, status } : order));
    };

    const isProductView = activeSection === "Products";
    const isOrderView = activeSection === "Orders";

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}><span className={styles.brandMark}>M</span><span>Maison <small>admin</small></span></div>
                <div className={styles.sidebarLabel}>Workspace</div>
                <nav className={styles.sidebarNav} aria-label="Admin navigation">
                    {["Overview", "Products", "Orders"].map((item) => (
                        <button className={`${styles.navItem} ${activeSection === item ? styles.activeNavItem : ""}`} type="button" key={item} onClick={() => selectSection(item)}>
                            <span className={styles.navIcon}>{item === "Overview" ? "◫" : item === "Products" ? "▦" : "◷"}</span>{item}
                        </button>
                    ))}
                </nav>
                <div className={styles.sidebarBottom}><button className={styles.navItem} type="button"><span className={styles.navIcon}>⚙</span>Settings</button><span className={styles.version}>Maison admin / v1.0</span></div>
            </aside>

            <main className={styles.main}>
                <header className={styles.topbar}>
                    <div><p className={styles.kicker}>Wednesday, September 09, 2026</p><h1>{activeSection}</h1></div>
                    <div className={styles.topActions}><button className={styles.iconButton} type="button" aria-label="Notifications">♢<span className={styles.notificationDot} /></button><div className={styles.adminProfile}><span className={styles.avatar}>AM</span><span><strong>Admin Maison</strong><small>Store manager</small></span></div></div>
                </header>

                {activeSection === "Overview" && <section className={styles.overview}>
                    <div className={styles.statsGrid}>
                        <Stat label="Total revenue" value="$18,426.00" note="Compared to last month" trend="↗ 12.8%" />
                        <Stat label="Total orders" value="248" note="32 orders this week" trend="↗ 8.4%" />
                        <Stat label="Products" value={products.length} note="Across 4 categories" trend="+ 4 new" />
                        <Stat label="Low stock" value={products.filter(({ stock }) => stock < 15).length} note="Products need restocking" trend="Attention" warning />
                    </div>
                    <div className={styles.overviewGrid}>
                        <section className={styles.panel}><PanelHeading eyebrow="Latest activity" title="Recent orders" action="View all ↗" onClick={() => selectSection("Orders")} /><OrderTable orders={orders.slice(0, 4)} onStatusChange={updateOrderStatus} compact /></section>
                        <section className={styles.panel}><PanelHeading eyebrow="Inventory" title="Best sellers" action="Manage ↗" onClick={() => selectSection("Products")} /><div className={styles.bestSellers}>{products.slice(0, 4).map((product, index) => <div className={styles.bestSeller} key={product.id}><span className={styles.rank}>0{index + 1}</span><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.category}</small></span><b>${product.price}</b></div>)}</div></section>
                    </div>
                </section>}

                {(isProductView || isOrderView) && <section className={styles.tableSection}>
                    <div className={styles.toolbar}><div className={styles.searchBox}><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isProductView ? "Search products or SKU" : "Search orders or customers"} /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All status</option>{(isProductView ? ["Active", "Draft"] : ["Pending", "Processing", "Shipped", "Delivered"]).map((status) => <option key={status}>{status}</option>)}</select>{isProductView && <button className={styles.primaryButton} type="button" onClick={() => setModalOpen(true)}>+ Add product</button>}</div>
                    <section className={styles.panel}><PanelHeading eyebrow={isProductView ? "Catalog" : "Sales activity"} title={isProductView ? "All products" : "All orders"} action={`${isProductView ? filteredProducts.length : filteredOrders.length} results`} /><>{isProductView ? <ProductTable products={filteredProducts} onToggleStatus={toggleProductStatus} /> : <OrderTable orders={filteredOrders} onStatusChange={updateOrderStatus} />}</></section>
                </section>}
            </main>

            {isModalOpen && <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}><form className={styles.modal} onSubmit={addProduct}><div className={styles.modalHeading}><div><p className={styles.panelEyebrow}>Catalog</p><h2>Add product</h2></div><button type="button" className={styles.closeButton} onClick={() => setModalOpen(false)} aria-label="Close">×</button></div><label>Product name<input required value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} placeholder="e.g. Silk Evening Shirt" /></label><div className={styles.formRow}><label>Category<select value={newProduct.category} onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })}><option>Outerwear</option><option>Dresses</option><option>Tailoring</option><option>Accessories</option></select></label><label>Price ($)<input required min="0" type="number" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} /></label><label>Stock<input required min="0" type="number" value={newProduct.stock} onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })} /></label></div><div className={styles.modalActions}><button className={styles.cancelButton} type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className={styles.primaryButton} type="submit">Create product</button></div></form></div>}
        </div>
    );
};

const Stat = ({ label, value, note, trend, warning }) => <div className={styles.statCard}><span className={styles.statLabel}>{label}<b className={warning ? styles.warning : ""}>{trend}</b></span><strong>{value}</strong><small>{note}</small></div>;

const PanelHeading = ({ eyebrow, title, action, onClick }) => <div className={styles.panelHeading}><div><p className={styles.panelEyebrow}>{eyebrow}</p><h2>{title}</h2></div><button className={styles.textButton} type="button" onClick={onClick}>{action}</button></div>;

const ProductTable = ({ products, onToggleStatus }) => <div className={styles.tableWrap}><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className={styles.productCell}><img src={product.image} alt="" /><strong>{product.name}</strong></div></td><td className={styles.muted}>{product.sku}</td><td className={styles.muted}>{product.category}</td><td>${product.price}</td><td><span className={product.stock < 15 ? styles.lowStock : ""}>{product.stock} units</span></td><td><span className={`${styles.status} ${styles[statusClass(product.status)]}`}>{product.status}</span></td><td><button className={styles.moreButton} type="button" onClick={() => onToggleStatus(product.id)} title="Toggle product status">•••</button></td></tr>)}</tbody></table>{products.length === 0 && <div className={styles.noResults}>No products match this search.</div>}</div>;

const OrderTable = ({ orders, onStatusChange, compact = false }) => <div className={styles.tableWrap}><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>{!compact && <th />}</tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small className={styles.itemCount}>{order.items} {order.items === 1 ? "item" : "items"}</small></td><td className={styles.muted}>{order.customer}</td><td className={styles.muted}>{order.date}</td><td>${order.total.toFixed(2)}</td><td><select className={`${styles.statusSelect} ${styles[statusClass(order.status)]}`} value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value)} aria-label={`Status for ${order.id}`}><option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option></select></td>{!compact && <td><button className={styles.moreButton} type="button" title="View order">•••</button></td>}</tr>)}</tbody></table>{orders.length === 0 && <div className={styles.noResults}>No orders match this search.</div>}</div>;

export default AdminPage;