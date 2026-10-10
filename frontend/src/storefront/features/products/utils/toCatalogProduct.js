const categoryNames = {
    cat_ao: "Áo",
    cat_dam: "Đầm",
    cat_quan: "Quần",
    cat_phukien: "Phụ kiện",
};

export const toCatalogProduct = (product) => {
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const colorGroups = Array.isArray(product.colors) ? product.colors : [];
    const sizes = [...new Set([
        ...variants.map(({ size }) => size),
        ...colorGroups.flatMap(({ sizes: colorSizes = [] }) => colorSizes.map(({ size }) => size)),
    ].filter(Boolean))];
    const colors = [...new Set([
        ...variants.map(({ color }) => color),
        ...colorGroups.map(({ color, name }) => color || name),
    ].filter(Boolean))];
    const colorImage = colorGroups.find(({ image }) => image)?.image;
    const variantImage = variants.find(({ image }) => image)?.image;
    const gallery = images.length ? images : [colorImage || variantImage].filter(Boolean);

    return {
        ...product,
        category: categoryNames[product.categoryId] || product.categoryId || "",
        image: images[0] || colorImage || variantImage || "",
        gallery,
        sizes: sizes.length ? sizes : ["One size"],
        color: colors.join(", "),
    };
};
