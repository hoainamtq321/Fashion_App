import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import styles from "./CartPage.module.css";

const CartPage = () => {
    const { items, updateQuantity, removeFromCart, cartCount, subtotal } = useCart();

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <p className={styles.eyebrow}>Your selections</p>
                <h1>Shopping bag</h1>
                <span>{cartCount} {cartCount === 1 ? "piece" : "pieces"}</span>
            </div>

            {items.length === 0 ? (
                <div className={styles.empty}>
                    <h2>Your bag is waiting.</h2>
                    <p>Discover considered pieces for the season ahead.</p>
                    <Link className={styles.continueLink} to="/">Continue shopping <span aria-hidden="true">↗</span></Link>
                </div>
            ) : (
                <div className={styles.layout}>
                    <div className={styles.items}>
                        {items.map((item) => (
                            <article className={styles.item} key={`${item.id}-${item.size}`}>
                                <Link to={`/products/${item.id}`} className={styles.imageLink}>
                                    <img src={item.image} alt={item.name} />
                                </Link>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemTopline}>
                                        <div>
                                            <p className={styles.category}>{item.category}</p>
                                            <h2>{item.name}</h2>
                                        </div>
                                        <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                                    </div>
                                    <p className={styles.meta}>Color: {item.color} / Size: {item.size}</p>
                                    <div className={styles.itemActions}>
                                        <div className={styles.quantity}>
                                            <button type="button" onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}>−</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>+</button>
                                        </div>
                                        <button className={styles.removeButton} type="button" onClick={() => removeFromCart(item.id, item.size)}>Remove</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className={styles.summary}>
                        <h2>Summary</h2>
                        <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                        <div><span>Shipping</span><span>Complimentary</span></div>
                        <div className={styles.total}><span>Total</span><strong>${subtotal.toFixed(2)}</strong></div>
                        <button className={styles.checkoutButton} type="button">Proceed to checkout</button>
                        <Link className={styles.continueLink} to="/">Continue shopping <span aria-hidden="true">↗</span></Link>
                    </aside>
                </div>
            )}
        </section>
    );
};

export default CartPage;