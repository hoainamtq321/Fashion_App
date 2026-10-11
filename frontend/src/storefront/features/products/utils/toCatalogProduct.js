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
    const colorOptions = colors.map((color) => {
        const colorGroup = colorGroups.find((group) => (group.color || group.name) === color);
        const colorVariants = variants.filter((variant) => variant.color === color);
        const image = colorGroup?.image || colorVariants.find((variant) => variant.image)?.image || "";
        const colorSizes = colorGroup?.sizes?.map(({ size }) => size)
            || colorVariants.map(({ size }) => size);

        return {
            name: color,
            image,
            sizes: [...new Set(colorSizes.filter(Boolean))],
        };
    });
    const colorImage = colorOptions.find(({ image }) => image)?.image;
    const gallery = [...new Set([
        ...images,
        ...colorOptions.map(({ image }) => image),
    ].filter(Boolean))];

    return {
        ...product,
        category: categoryNames[product.categoryId] || product.categoryId || "",
        image: images[0] || colorImage || "",
        gallery,
        sizes: sizes.length ? sizes : ["One size"],
        color: colors.join(", "),
        colorOptions,
    };
};
