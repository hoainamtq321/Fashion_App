import { useAdminData } from "../../context/AdminDataContext";
import PanelHeading from "../../components/PanelHeading";
import { OrderTable } from "../../components/AdminTables";
import Stat from "../../components/Stat";
import styles from "../../components/AdminShared.module.css";

const OverviewPage = () => {
    const { products, orders, updateOrderStatus } = useAdminData();

    return (
        <section>
            <div className={styles.statsGrid}>
                <Stat label="Total revenue" value="$18,426.00" note="Compared to last month" trend="↗ 12.8%" />
                <Stat label="Total orders" value="248" note="32 orders this week" trend="↗ 8.4%" />
                <Stat label="Products" value={products.length} note="Across 4 categories" trend="+ 4 new" />
                <Stat label="Low stock" value={products.filter(({ stock }) => stock < 15).length} note="Products need restocking" trend="Attention" warning />
            </div>
            <div className={styles.overviewGrid}>
                <section className={styles.panel}>
                    <PanelHeading eyebrow="Latest activity" title="Recent orders" action="View all ↗" to="/admin/orders" />
                    <OrderTable orders={orders.slice(0, 4)} onStatusChange={updateOrderStatus} compact />
                </section>
                <section className={styles.panel}>
                    <PanelHeading eyebrow="Inventory" title="Best sellers" action="Manage ↗" to="/admin/products" />
                    <div className={styles.bestSellers}>
                        {products.slice(0, 4).map((product, index) => (
                            <div className={styles.bestSeller} key={product.id}>
                                <span className={styles.rank}>0{index + 1}</span>
                                <img src={product.image} alt="" />
                                <span><strong>{product.name}</strong><small>{product.category}</small></span>
                                <b>${product.price}</b>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
};

export default OverviewPage;
