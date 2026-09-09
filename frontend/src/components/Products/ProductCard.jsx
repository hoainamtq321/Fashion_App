import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";
import { useCart } from "../../context/useCart";

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <article className={styles.card}>
            <Link className={styles.imageLink} to={`/products/${product.id}`}>
                <div className={styles.imageWrap}>
                    <img className={styles.image} src={product.image} alt={product.name} />
                    {product.badge && <span className={styles.badge}>{product.badge}</span>}
                </div>
            </Link>
            <div className={styles.info}>
                <div>
                    <p className={styles.category}>{product.category}</p>
                    <h3 className={styles.name}>{product.name}</h3>
                </div>
                <div className={styles.priceGroup}>
                    <span className={styles.price}>${product.price}</span>
                    {product.compareAtPrice && <span className={styles.comparePrice}>${product.compareAtPrice}</span>}
                </div>
            </div>
            <Link className={styles.viewLink} to={`/products/${product.id}`}>View product <span aria-hidden="true">↗</span></Link>
            <button className={styles.addButton} type="button" onClick={() => addToCart(product, product.sizes[0])}>Add to bag</button>
        </article>
    );
};

export default ProductCard;