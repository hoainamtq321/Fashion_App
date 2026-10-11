import ProductCard from "./ProductCard";
import styles from "./ProductList.module.css";

const ProductList = ({
    products = [],
    isLoading = false,
    error = null,
    retry,
    title = "The edit",
    eyebrow = "Curated wardrobe",
}) => {
    // 1. Kiểm tra toàn bộ props truyền vào component
    console.log("👉 Tất cả props của ProductList:", { products, isLoading, error });
    return (
        <section
            className={styles.section}
            aria-labelledby="product-list-title"
            aria-busy={isLoading}
        >
            <div className={styles.headingRow}>
                <div>
                    <p className={styles.eyebrow}>{eyebrow}</p>
                    <h2 id="product-list-title" className={styles.title}>{title}</h2>
                </div>
                {!isLoading && !error && products.length > 0 && (
                    <span className={styles.count}>{products.length} pieces</span>
                )}
            </div>
            {isLoading ? (
                <div className={styles.grid} role="status" aria-label="Đang tải sản phẩm">
                    {Array.from({ length: 4 }, (_, index) => (
                        <div className={styles.skeletonCard} key={index} aria-hidden="true">
                            <div className={styles.skeletonImage} />
                            <div className={styles.skeletonText} />
                            <div className={styles.skeletonTextShort} />
                            <div className={styles.skeletonTextPrice} />
                            <div className={styles.skeletonButton} />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className={styles.stateMessage} role="alert">
                    <p>Không thể tải sản phẩm. Vui lòng thử lại.</p>
                    <button className={styles.retryButton} type="button" onClick={retry}>
                        Thử tải lại
                    </button>
                </div>
            ) : products.length > 0 ? (
                <div className={styles.grid}>
                    {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
            ) : (
                <p className={styles.stateMessage}>Hiện chưa có sản phẩm nào.</p>
            )}
        </section>
    );
};

export default ProductList;