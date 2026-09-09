import HomeBanner from "../../components/Products/HomeBanner";
import ProductList from "../../components/Products/ProductList";

const Home = () => {
    return (
        <>
            <HomeBanner />
            <div id="the-edit">
                <ProductList />
            </div>
        </>
    );
}

export default Home;