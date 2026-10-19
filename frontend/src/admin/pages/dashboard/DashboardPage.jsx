import { useAdminData } from "../../context/AdminDataContext";
import { useState } from "react";
import PanelHeading from "../../components/PanelHeading";
import { OrderTable } from "../../components/AdminTables";
import Stat from "../../components/Stat";
import styles from "../../components/AdminShared.module.css";

const OverviewPage = () => {
    const { products, orders, updateOrderStatus } = useAdminData();
    const [orderError, setOrderError] = useState("");
    const paidRevenue = orders
        .filter(({ paymentStatus }) => paymentStatus === "Paid")
        .reduce((total, { total: orderTotal }) => total + Number(orderTotal || 0), 0);
    const handleOrderStatusChange = async (orderId, status) => {
        setOrderError("");
        try {
            await updateOrderStatus(orderId, status);
        } catch (error) {
            setOrderError(error instanceof Error ? error.message : "Could not update order status.");
        }
    };

    return (
        <section>
            {orderError && <p className={styles.formMessage} role="alert">{orderError}</p>}
            <div className={styles.statsGrid}>
                <Stat label="Paid revenue" value={`${paidRevenue.toLocaleString("vi-VN")} ₫`} note="From paid orders" trend={`${orders.length} orders`} />
                <Stat label="Total orders" value={orders.length} note="All recorded orders" trend="Live" />
                <Stat label="Products" value={products.length} note="Across 4 categories" trend="+ 4 new" />
                <Stat label="Low stock" value={products.filter(({ stock }) => stock < 15).length} note="Products need restocking" trend="Attention" warning />
            </div>
            <div className={styles.overviewGrid}>
                <section className={styles.panel}>
                    <PanelHeading eyebrow="Latest activity" title="Recent orders" action="View all ↗" to="/admin/orders" />
                    <OrderTable orders={orders.slice(0, 4)} onStatusChange={handleOrderStatusChange} compact />
                </section>
                <section className={styles.panel}>
                    <PanelHeading eyebrow="Inventory" title="Best sellers" action="Manage ↗" to="/admin/products" />
                    <div className={styles.bestSellers}>
                        {products.slice(0, 4).map((product, index) => (
                            <div className={styles.bestSeller} key={product.id}>
                                <span className={styles.rank}>0{index + 1}</span>
                                <img src={product.image} alt="" />
                                <span><strong>{product.name}</strong><small>{product.category}</small></span>
                                <b>{Number(product.price || 0).toLocaleString("vi-VN")} ₫</b>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
};

export default OverviewPage;
