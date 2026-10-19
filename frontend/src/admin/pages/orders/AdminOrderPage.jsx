import { useMemo, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { OrderTable } from "../../components/AdminTables";
import PanelHeading from "../../components/PanelHeading";
import { ORDER_STATUS_CATALOG } from "../../../../lib/orderStatusCatalog";
import styles from "../../components/AdminShared.module.css";

const OrdersPage = () => {
    const { orders, updateOrderStatus, isLoadingOrders, ordersError, retryOrders } = useAdminData();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All status");
    const [statusError, setStatusError] = useState("");

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const matchesSearch = `${order.id} ${order.number || ""} ${order.customer}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (statusFilter === "All status" || order.status === statusFilter);
    }), [orders, search, statusFilter]);

    const changeOrderStatus = async (orderId, status) => {
        setStatusError("");
        try {
            await updateOrderStatus(orderId, status);
        } catch (error) {
            setStatusError(error instanceof Error ? error.message : "Could not update order status.");
        }
    };

    return (
        <section className={styles.tableSection}>
            {statusError && <p className={styles.formMessage} role="alert">{statusError}</p>}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders or customers" /></div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                    <option>All status</option>
                    {ORDER_STATUS_CATALOG.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>
            <section className={styles.panel}>
                <PanelHeading eyebrow="Sales activity" title="All orders" action={`${filteredOrders.length} results`} />
                {isLoadingOrders && <p className={styles.muted} role="status">Loading orders…</p>}
                {ordersError && (
                    <div className={styles.orderLoadError}>
                        <p className={styles.formMessage} role="alert">{ordersError}</p>
                        <button className={styles.secondaryButton} type="button" onClick={retryOrders}>Try again</button>
                    </div>
                )}
                {!isLoadingOrders && !ordersError && (
                    <OrderTable
                        orders={filteredOrders}
                        onStatusChange={changeOrderStatus}
                        hasOrders={orders.length > 0}
                        emptyMessage={orders.length ? "No orders match this search or status." : "No orders yet."}
                    />
                )}
            </section>
        </section>
    );
};

export default OrdersPage;
