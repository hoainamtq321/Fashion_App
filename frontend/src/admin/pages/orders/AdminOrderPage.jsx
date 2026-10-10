import { useMemo, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { OrderTable } from "../../components/AdminTables";
import PanelHeading from "../../components/PanelHeading";
import styles from "../../components/AdminShared.module.css";

const OrdersPage = () => {
    const { orders, updateOrderStatus } = useAdminData();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All status");

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const matchesSearch = `${order.id} ${order.customer}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (statusFilter === "All status" || order.status === statusFilter);
    }), [orders, search, statusFilter]);

    return (
        <section className={styles.tableSection}>
            <div className={styles.toolbar}>
                <div className={styles.searchBox}><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders or customers" /></div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                    <option>All status</option><option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option>
                </select>
            </div>
            <section className={styles.panel}>
                <PanelHeading eyebrow="Sales activity" title="All orders" action={`${filteredOrders.length} results`} />
                <OrderTable orders={filteredOrders} onStatusChange={updateOrderStatus} />
            </section>
        </section>
    );
};

export default OrdersPage;
