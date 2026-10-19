import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../../services/firebase";
import styles from "./Header.module.css";
import { useCart } from "../../../features/cart/hooks/useCart";

const Header = ({ user, isAdmin }) => {
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [redirectAfterLogout, setRedirectAfterLogout] = useState(false);
    const navigate = useNavigate();
    const { cartCount } = useCart();

    const closeAccountMenu = () => setAccountMenuOpen(false);

    useEffect(() => {
        if (redirectAfterLogout && !user) {
            navigate("/login", { replace: true });
        }
    }, [navigate, redirectAfterLogout, user]);

    const handleLogout = async () => {
        closeAccountMenu();
        await signOut(auth);
        setRedirectAfterLogout(true);
    };

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <Link className={styles.logo} to="/">Maison</Link>

                <div className={styles.middle}>
                    <nav className={styles.navigation} aria-label="Main navigation">
                        <Link className={styles.navLink} to="/">Home</Link>
                        <Link className={styles.navLink} to="/?collection=new-arrivals">New arrivals</Link>
                        <Link className={styles.navLink} to="/?collection=collections">Collections</Link>
                        <Link className={styles.navLink} to="/?collection=sale">Sale</Link>
                    </nav>

                    <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
                        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
                        <input className={styles.searchInput} type="search" placeholder="Search" aria-label="Search products" />
                    </form>
                </div>

                <div className={styles.actions}>
                    <div className={styles.accountMenu} onMouseLeave={closeAccountMenu}>
                        <button
                            className={styles.accountButton}
                            type="button"
                            aria-expanded={accountMenuOpen}
                            aria-haspopup="menu"
                            onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
                        >
                            <span className={styles.accountIcon} aria-hidden="true">♙</span>
                            <span>Account</span>
                            <span className={styles.chevron} aria-hidden="true">⌄</span>
                        </button>

                        {accountMenuOpen && (
                            <div className={styles.dropdown} role="menu">
                                {user ? (
                                    <>
                                        <span className={styles.userEmail}>{user.email}</span>
                                        {isAdmin && (
                                            <Link className={styles.menuItem} to="/admin" role="menuitem" onClick={closeAccountMenu}>
                                                Admin dashboard
                                            </Link>
                                        )}
                                        <Link className={styles.menuItem} to="/profile" role="menuitem" onClick={closeAccountMenu}>
                                            Profile
                                        </Link>
                                        <Link className={styles.menuItem} to="/orders" role="menuitem" onClick={closeAccountMenu}>
                                            My orders
                                        </Link>
                                        <button className={styles.menuItem} type="button" role="menuitem" onClick={handleLogout}>
                                            Log out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.menuLabel}>You are not signed in</span>
                                        <Link className={styles.menuItem} to="/login" role="menuitem" onClick={closeAccountMenu}>
                                            Sign in
                                        </Link>
                                        <Link className={styles.menuItem} to="/register" role="menuitem" onClick={closeAccountMenu}>
                                            Create account
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <Link className={styles.cartButton} to="/cart" aria-label="Open shopping bag">
                        <span className={styles.cartIcon} aria-hidden="true">♧</span>
                        <span>Bag ({cartCount})</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default Header;