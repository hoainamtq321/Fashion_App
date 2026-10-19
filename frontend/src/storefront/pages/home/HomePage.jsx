import { useMemo, useState } from "react";
import HomeBanner from "./components/HomeBanner";
import ProductList from "../../features/products/components/ProductList";
import { useProducts } from "../../features/products/hooks/useProducts";
import styles from "./HomePage.module.css";

const Home = () => {
    const productState = useProducts();
    const [selectedCategory, setSelectedCategory] = useState("");
    const categories = useMemo(
        () => [...new Set(productState.products.map(({ category }) => category).filter(Boolean))],
        [productState.products],
    );
    const visibleProducts = useMemo(
        () => selectedCategory
            ? productState.products.filter((product) => product.category === selectedCategory)
            : productState.products,
        [productState.products, selectedCategory],
    );

    return (
        <>
            <HomeBanner />
            <nav className={styles.categoryNav} aria-label="Danh mục sản phẩm">
                <div className={styles.categoryList}>
                    <button
                        className={`${styles.categoryButton} ${selectedCategory === "" ? styles.selected : ""}`}
                        type="button"
                        aria-pressed={selectedCategory === ""}
                        onClick={() => setSelectedCategory("")}
                    >
                        Tất cả
                    </button>
                    {categories.map((category) => (
                        <button
                            className={`${styles.categoryButton} ${selectedCategory === category ? styles.selected : ""}`}
                            key={category}
                            type="button"
                            aria-pressed={selectedCategory === category}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </nav>
            <div id="the-edit">
                <ProductList
                    {...productState}
                    products={visibleProducts}
                    title={selectedCategory || "The edit"}
                />
            </div>
        </>
    );
}

export default Home;