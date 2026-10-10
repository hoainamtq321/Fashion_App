import { fakeProducts } from "../../../../shared/data/mockProducts";
import ProductCard from "./ProductCard";
import styles from "./ProductList.module.css";

const ProductList = ({ products = fakeProducts, title = "The edit", eyebrow = "Curated wardrobe" }) => {
    return (
        <section className={styles.section} aria-labelledby="product-list-title">
            <div className={styles.headingRow}>
                <div>
                    <p className={styles.eyebrow}>{eyebrow}</p>
                    <h2 id="product-list-title" className={styles.title}>{title}</h2>
                </div>
                <span className={styles.count}>{products.length} pieces</span>
            </div>
            <div className={styles.grid}>
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
        </section>
    );
};

export default ProductList;