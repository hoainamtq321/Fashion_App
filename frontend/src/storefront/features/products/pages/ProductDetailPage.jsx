import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchProductById } from "../services/productsApi";
import { toCatalogProduct } from "../utils/toCatalogProduct";
import styles from "./ProductDetailPage.module.css";
import { useCart } from "../../cart/hooks/useCart";

const ProductDetailPage = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loadedProductId, setLoadedProductId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    useEffect(() => {
        let isCurrent = true;

        const loadProduct = async () => {
            setIsLoading(true);
            setError(null);
            setProduct(null);

            try {
                const result = await fetchProductById(productId);
                if (isCurrent) {
                    const catalogProduct = toCatalogProduct(result);
                    const initialColor = catalogProduct.colorOptions[0];
                    const initialImage = initialColor?.image
                        ? catalogProduct.gallery.indexOf(initialColor.image)
                        : -1;
                    setProduct(catalogProduct);
                    setSelectedColor(initialColor?.name || "");
                    setSelectedImage(initialImage >= 0 ? initialImage : 0);
                    setSelectedSize(initialColor?.sizes[0] || catalogProduct.sizes[0] || "");
                    setQuantity(1);
                }
            } catch (loadError) {
                console.error("[getProductById] Gọi API thất bại:", loadError);
                if (isCurrent) {
                    setError(loadError);
                }
            } finally {
                if (isCurrent) {
                    setLoadedProductId(productId);
                    setIsLoading(false);
                }
            }
        };

        loadProduct();

        return () => {
            isCurrent = false;
        };
    }, [productId, attempt]);

    if (isLoading || loadedProductId !== productId) {
        return (
            <section className={styles.notFound} role="status" aria-busy="true">
                <p className={styles.eyebrow}>Loading product</p>
                <h1>Loading product details…</h1>
            </section>
        );
    }

    if (error?.status === 404) {
        return (
            <section className={styles.notFound}>
                <p className={styles.eyebrow}>Product unavailable</p>
                <h1>We could not find that piece.</h1>
                <Link className={styles.backLink} to="/">Return to the edit</Link>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.notFound} role="alert">
                <p className={styles.eyebrow}>Unable to load product</p>
                <h1>Please try again.</h1>
                <button className={styles.retryButton} type="button" onClick={() => setAttempt((currentAttempt) => currentAttempt + 1)}>
                    Try again
                </button>
                <Link className={styles.backLink} to="/">Return to the edit</Link>
            </section>
        );
    }

    if (!product) {
        return (
            <section className={styles.notFound}>
                <p className={styles.eyebrow}>Product unavailable</p>
                <h1>We could not find that piece.</h1>
                <Link className={styles.backLink} to="/">Return to the edit</Link>
            </section>
        );
    }

    const selectedColorOption = product.colorOptions.find(({ name }) => name === selectedColor);
    const availableSizes = selectedColorOption?.sizes.length
        ? selectedColorOption.sizes
        : product.sizes;

    const selectColor = (colorOption) => {
        setSelectedColor(colorOption.name);
        if (colorOption.sizes.length) {
            setSelectedSize(colorOption.sizes[0]);
        }
        if (colorOption.image) {
            const imageIndex = product.gallery.indexOf(colorOption.image);
            if (imageIndex >= 0) setSelectedImage(imageIndex);
        }
    };

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
                        <div className={styles.optionHeading}><span>Color</span><strong>{selectedColor || product.color}</strong></div>
                        <div className={styles.colorChoices}>
                            {product.colorOptions.map((colorOption) => (
                                <button
                                    className={`${styles.colorChoice} ${selectedColor === colorOption.name ? styles.selectedColorChoice : ""}`}
                                    key={colorOption.name}
                                    type="button"
                                    onClick={() => selectColor(colorOption)}
                                    aria-pressed={selectedColor === colorOption.name}
                                >
                                    {colorOption.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.optionGroup}>
                        <div className={styles.optionHeading}><span>Size</span><Link to="#size-guide">Size guide</Link></div>
                        <div className={styles.sizeGrid}>
                            {availableSizes.map((size) => (
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
                        <button className={styles.addButton} type="button" onClick={() => addToCart({ ...product, color: selectedColor || product.color }, selectedSize, quantity)}>Add to bag</button>
                    </div>
                    <div className={styles.detailsNote}><span>✓</span> Complimentary shipping on orders over $150</div>
                </div>
            </div>
        </section>
    );
};

export default ProductDetailPage;