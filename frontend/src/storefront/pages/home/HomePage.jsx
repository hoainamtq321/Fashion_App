import HomeBanner from "./components/HomeBanner";
import ProductList from "../../features/products/components/ProductList";
import { useProducts } from "../../features/products/hooks/useProducts";

const Home = () => {
    const products = useProducts();

    return (
        <>
            <HomeBanner />
            <div id="the-edit">
                <ProductList products={products} />
            </div>
        </>
    );
}

export default Home;