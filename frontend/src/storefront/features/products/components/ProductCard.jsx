import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";

const ProductCard = ({ product }) => {
    const formatPrice = (price) => `${Number(price || 0).toLocaleString("vi-VN")} ₫`;
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
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                    {product.compareAtPrice && <span className={styles.comparePrice}>{formatPrice(product.compareAtPrice)}</span>}
                </div>
            </div>
            <Link className={styles.addButton} to={`/products/${product.id}`}>Choose options</Link>
        </article>
    );
};

export default ProductCard;