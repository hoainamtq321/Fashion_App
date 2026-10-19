export const createColorGroup = (color = "", image = "", sizes = [{ size: "", stock: "" }]) => ({
    id: `color-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    color,
    image,
    sizes,
});

export const createEmptyProductForm = () => ({
    name: "",
    categoryId: "cat_ao",
    description: "",
    price: "",
    status: "active",
    images: [""],
    colors: [createColorGroup()],
});

export const getColorGroups = (product) => {
    if (Array.isArray(product.colors) && product.colors.length) {
        return product.colors.map(({ color, name, image, sizes }) => createColorGroup(
            color || name || "",
            image || "",
            Array.isArray(sizes) && sizes.length
                ? sizes.map(({ size, stock }) => ({ size: size || "", stock: stock ?? "" }))
                : [{ size: "", stock: "" }],
        ));
    }

    const groupsByColor = new Map();
    (product.variants || []).forEach(({ color, size, stock, image }) => {
        const groupName = color || "";
        if (!groupsByColor.has(groupName)) {
            groupsByColor.set(groupName, { image: image || "", sizes: [] });
        }
        groupsByColor.get(groupName).sizes.push({ size: size || "", stock: stock ?? "" });
    });

    if (!groupsByColor.size) {
        const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["One size"];
        return [createColorGroup(
            product.color || "",
            product.image || "",
            sizes.map((size, index) => ({ size, stock: index === 0 ? product.stock ?? 0 : 0 })),
        )];
    }

    return [...groupsByColor.entries()].map(([color, group]) => createColorGroup(
        color,
        group.image,
        group.sizes.length ? group.sizes : [{ size: "", stock: "" }],
    ));
};
