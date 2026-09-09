import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { getProductById } from "../../components/Products/productData";
import styles from "./ProductDetailPage.module.css";
import { useCart } from "../../context/useCart";

const ProductDetailPage = () => {
    const { productId } = useParams();
    const product = getProductById(productId);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(product?.sizes[0] || "");
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    if (!product) {
        return (
            <section className={styles.notFound}>
                <p className={styles.eyebrow}>Product unavailable</p>
                <h1>We could not find that piece.</h1>
                <Link className={styles.backLink} to="/">Return to the edit</Link>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <Link className={styles.backLink} to="/">← Back to the edit</Link>
            <div className={styles.productLayout}>
                <div className={styles.gallery}>
                    <div className={styles.mainImageWrap}>
                        <img className={styles.mainImage} src={product.gallery[selectedImage]} alt={`${product.name} view ${selectedImage + 1}`} />
                    </div>
                    <div className={styles.thumbnails}>
                        {product.gallery.map((image, index) => (
                            <button
                                className={`${styles.thumbnail} ${index === selectedImage ? styles.selectedThumbnail : ""}`}
                                key={image}
                                type="button"
                                onClick={() => setSelectedImage(index)}
                                aria-label={`Show image ${index + 1}`}
                            >
                                <img src={image} alt="" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.details}>
                    <p className={styles.category}>{product.category}</p>
                    <h1 className={styles.title}>{product.name}</h1>
                    <div className={styles.priceRow}>
                        <span className={styles.price}>${product.price}</span>
                        {product.compareAtPrice && <span className={styles.comparePrice}>${product.compareAtPrice}</span>}
                    </div>
                    <p className={styles.description}>{product.description}</p>

                    <div className={styles.optionGroup}>
                        <div className={styles.optionHeading}><span>Color</span><strong>{product.color}</strong></div>
                        <span className={styles.colorSwatch} title={product.color} />
                    </div>
                    <div className={styles.optionGroup}>
                        <div className={styles.optionHeading}><span>Size</span><Link to="#size-guide">Size guide</Link></div>
                        <div className={styles.sizeGrid}>
                            {product.sizes.map((size) => (
                                <button className={`${styles.sizeButton} ${selectedSize === size ? styles.selectedSize : ""}`} key={size} type="button" onClick={() => setSelectedSize(size)}>{size}</button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.purchaseRow}>
                        <div className={styles.quantity} aria-label="Quantity">
                            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity">+</button>
                        </div>
                        <button className={styles.addButton} type="button" onClick={() => addToCart(product, selectedSize, quantity)}>Add to bag</button>
                    </div>
                    <div className={styles.detailsNote}><span>✓</span> Complimentary shipping on orders over $150</div>
                </div>
            </div>
        </section>
    );
};

export default ProductDetailPage;