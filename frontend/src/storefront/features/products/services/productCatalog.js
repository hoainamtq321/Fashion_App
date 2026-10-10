import { fakeProducts } from "../../../../shared/data/mockProducts";

export const getProductById = (productId) => fakeProducts.find(({ id }) => id === productId);
