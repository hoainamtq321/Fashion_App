import { useEffect } from "react";

const Home = () => {
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch("/api/getProducts");
                const responseText = await response.text();
                let result;

                try {
                    result = JSON.parse(responseText);
                } catch {
                    throw new Error(`API returned non-JSON response: ${responseText.slice(0, 200)}`);
                }

                if (!response.ok) {
                    throw new Error(result.message || `Request failed with status ${response.status}`);
                }

                console.log("Products API response:", result);
                console.log(`Received ${result.count} product(s) from API.`);
            } catch (error) {
                console.error("Failed to fetch products from API:", error);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <p>This is the main landing page of the application.</p>
        </div>
    );
}

export default Home;