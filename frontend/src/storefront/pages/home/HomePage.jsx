import HomeBanner from "./components/HomeBanner";
import ProductList from "../../features/products/components/ProductList";
import { useProducts } from "../../features/products/hooks/useProducts";

const Home = () => {
    const productState = useProducts();

    return (
        <>
            <HomeBanner />
            <div id="the-edit">
                <ProductList {...productState} />
            </div>
        </>
    );
}

export default Home;