import { NavLink, Outlet, useLocation } from "react-router-dom";
import styles from "../components/AdminShared.module.css";

const navigationItems = [
    { label: "Overview", path: "/admin", icon: "◫", end: true },
    { label: "Products", path: "/admin/products", icon: "▦" },
    { label: "Orders", path: "/admin/orders", icon: "◷" },
];

const getPageTitle = (pathname) => {
    if (pathname.startsWith("/admin/products")) return "Products";
    if (pathname.startsWith("/admin/orders")) return "Orders";
    return "Overview";
};

const AdminLayout = () => {
    const { pathname } = useLocation();

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}><span className={styles.brandMark}>M</span><span>Maison <small>admin</small></span></div>
                <div className={styles.sidebarLabel}>Workspace</div>
                <nav className={styles.sidebarNav} aria-label="Admin navigation">
                    {navigationItems.map(({ label, path, icon, end }) => (
                        <NavLink
                            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNavItem : ""}`}
                            end={end}
                            key={path}
                            to={path}
                        >
                            <span className={styles.navIcon}>{icon}</span>{label}
                        </NavLink>
                    ))}
                </nav>
                <div className={styles.sidebarBottom}>
                    <button className={styles.navItem} type="button"><span className={styles.navIcon}>⚙</span>Settings</button>
                    <span className={styles.version}>Maison admin / v1.0</span>
                </div>
            </aside>

            <main className={styles.main}>
                <header className={styles.topbar}>
                    <div><p className={styles.kicker}>Wednesday, September 09, 2026</p><h1>{getPageTitle(pathname)}</h1></div>
                    <div className={styles.topActions}>
                        <button className={styles.iconButton} type="button" aria-label="Notifications">♢<span className={styles.notificationDot} /></button>
                        <div className={styles.adminProfile}><span className={styles.avatar}>AM</span><span><strong>Admin Maison</strong><small>Store manager</small></span></div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
