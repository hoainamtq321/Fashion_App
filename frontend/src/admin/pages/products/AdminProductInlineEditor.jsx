import { useEffect, useRef, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import ProductFormModal from "./ProductFormModal";
import { createColorGroup, getColorGroups } from "./productFormUtils";
import { updateAdminProduct, uploadProductImage } from "../../services/adminProductsApi";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const createProductForm = (product) => ({
    name: product.name,
    categoryId: product.categoryId || "cat_ao",
    description: product.description || "",
    price: product.price,
    status: product.status === "Draft" ? "draft" : "active",
    images: [...(product.images || [product.image || ""]).filter(Boolean).slice(0, 4), ""].slice(0, 4),
    colors: getColorGroups(product),
});

const AdminProductInlineEditor = ({ product, onCancel, onSaved }) => {
    const { categories, addCategory, products, setProducts, clearProductsError } = useAdminData();
    const [productForm, setProductForm] = useState(() => createProductForm(product));
    const [categoryName, setCategoryName] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [formError, setFormError] = useState("");
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const selectedImageFiles = useRef(new Map());
    const selectedVariantFiles = useRef(new Map());
    const previewUrls = useRef(new Set());

    const createPreview = (file) => {
        const preview = URL.createObjectURL(file);
        previewUrls.current.add(preview);
        return preview;
    };

    const releasePreview = (preview) => {
        if (!previewUrls.current.delete(preview)) return;
        URL.revokeObjectURL(preview);
    };

    const cleanupPreviews = () => {
        previewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
        previewUrls.current.clear();
        selectedImageFiles.current.clear();
        selectedVariantFiles.current.clear();
    };

    useEffect(() => cleanupPreviews, []);

    const cancelEditing = () => {
        if (isUploadingImages) return;
        cleanupPreviews();
        onCancel();
    };

    const updateColor = (colorId, field, value) => {
        setProductForm((currentForm) => ({
            ...currentForm,
            colors: currentForm.colors.map((group) => group.id === colorId ? { ...group, [field]: value } : group),
        }));
    };

    const addColor = () => {
        setProductForm((currentForm) => ({ ...currentForm, colors: [...currentForm.colors, createColorGroup()] }));
    };

    const removeColor = (colorId) => {
        const removedColor = productForm.colors.find(({ id }) => id === colorId);
        if (removedColor?.image?.startsWith("blob:")) releasePreview(removedColor.image);
        selectedVariantFiles.current.delete(colorId);
        setProductForm((currentForm) => ({
            ...currentForm,
            colors: currentForm.colors.filter(({ id }) => id !== colorId),
        }));
    };

    const updateSize = (colorId, sizeIndex, field, value) => {
        setProductForm((currentForm) => ({
            ...currentForm,
            colors: currentForm.colors.map((group) => group.id === colorId
                ? { ...group, sizes: group.sizes.map((size, index) => index === sizeIndex ? { ...size, [field]: value } : size) }
                : group),
        }));
    };

    const addSize = (colorId) => {
        setProductForm((currentForm) => ({
            ...currentForm,
            colors: currentForm.colors.map((group) => group.id === colorId
                ? { ...group, sizes: [...group.sizes, { size: "", stock: "" }] }
                : group),
        }));
    };

    const removeSize = (colorId, sizeIndex) => {
        setProductForm((currentForm) => ({
            ...currentForm,
            colors: currentForm.colors.map((group) => group.id === colorId && group.sizes.length > 1
                ? { ...group, sizes: group.sizes.filter((_, index) => index !== sizeIndex) }
                : group),
        }));
    };

    const removeImage = (index) => {
        const image = productForm.images[index];
        if (image) {
            selectedImageFiles.current.delete(image);
            if (image.startsWith("blob:")) releasePreview(image);
        }
        setProductForm((currentForm) => ({
            ...currentForm,
            images: [...currentForm.images.filter((_, imageIndex) => imageIndex !== index && currentForm.images[imageIndex]), ""],
        }));
    };

    const uploadImages = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        const invalidFile = files.find((file) => !acceptedImageTypes.has(file.type) || file.size > MAX_IMAGE_BYTES);
        if (invalidFile) {
            setFormError(`${invalidFile.name} must be a supported image type and no larger than 3 MB.`);
            event.target.value = "";
            return;
        }

        const remainingSlots = 4 - productForm.images.filter(Boolean).length;
        const selectedFiles = files.slice(0, remainingSlots);
        if (!selectedFiles.length) {
            setFormError("A product can have up to 4 main images.");
            event.target.value = "";
            return;
        }

        const previews = selectedFiles.map((file) => {
            const preview = createPreview(file);
            selectedImageFiles.current.set(preview, file);
            return preview;
        });
        setFormError(files.length > remainingSlots ? "A product can have up to 4 main images; extra files were not added." : "");
        setProductForm((currentForm) => ({
            ...currentForm,
            images: [...currentForm.images.filter(Boolean), ...previews, ""].slice(0, 4),
        }));
        event.target.value = "";
    };

    const uploadVariantImage = (event, colorId) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!acceptedImageTypes.has(file.type) || file.size > MAX_IMAGE_BYTES) {
            setFormError(`${file.name} must be a supported image type and no larger than 3 MB.`);
            event.target.value = "";
            return;
        }

        const previousColor = productForm.colors.find(({ id }) => id === colorId);
        if (previousColor?.image?.startsWith("blob:")) releasePreview(previousColor.image);
        const preview = createPreview(file);
        updateColor(colorId, "image", preview);
        selectedVariantFiles.current.set(colorId, file);
        setFormError("");
        event.target.value = "";
    };

    const createCategory = () => {
        const label = categoryName.trim();
        if (!label) {
            setCategoryError("Enter a category name.");
            return;
        }

        const { category, created } = addCategory(label);
        setCategoryError(created ? "" : "This category already exists. It has been selected.");
        setProductForm((currentForm) => ({ ...currentForm, categoryId: category.id }));
        setCategoryName("");
    };

    const saveProduct = async (event) => {
        event.preventDefault();
        if (isUploadingImages) return;
        if (!productForm.colors.length) {
            setFormError("Add at least one color.");
            return;
        }

        const normalizedColors = productForm.colors.map(({ id, color, image, sizes }) => ({
            id,
            color: color.trim(),
            image,
            sizes: sizes.map(({ size, stock }) => ({ size: size.trim(), stock })),
        }));
        const hasInvalidColorOrSize = normalizedColors.some(({ color, sizes }) => (
            !color || !sizes.length || sizes.some(({ size, stock }) => (
                !size || stock === "" || !Number.isInteger(Number(stock)) || Number(stock) < 0
            ))
        ));
        if (hasInvalidColorOrSize) {
            setFormError("Each color must have a name and at least one size with a whole, non-negative stock quantity.");
            return;
        }

        const hasDuplicateSizes = normalizedColors.some(({ sizes }) => {
            const sizeNames = sizes.map(({ size }) => size.toLocaleLowerCase());
            return new Set(sizeNames).size !== sizeNames.length;
        });
        if (hasDuplicateSizes) {
            setFormError("A size can only be added once for each color.");
            return;
        }

        const duplicateColors = normalizedColors.some(({ color }, index) => (
            normalizedColors.findIndex(({ color: otherColor }) => otherColor.toLocaleLowerCase() === color.toLocaleLowerCase()) !== index
        ));
        if (duplicateColors) {
            setFormError("Each color can only be added once.");
            return;
        }

        const category = categories.find(({ id }) => id === productForm.categoryId);
        if (!category) {
            setFormError("Select a valid product category.");
            return;
        }

        setFormError("");
        clearProductsError();
        setIsUploadingImages(true);
        try {
            const images = [];
            for (const image of productForm.images.map((value) => value.trim()).filter(Boolean)) {
                const file = selectedImageFiles.current.get(image);
                const uploadedUrl = file ? await uploadProductImage(file) : image;
                images.push(uploadedUrl);
                if (file) {
                    selectedImageFiles.current.delete(image);
                    releasePreview(image);
                    setProductForm((currentForm) => ({
                        ...currentForm,
                        images: currentForm.images.map((currentImage) => currentImage === image ? uploadedUrl : currentImage),
                    }));
                }
            }

            const colors = [];
            for (const group of normalizedColors) {
                const selectedFile = selectedVariantFiles.current.get(group.id);
                const image = selectedFile ? await uploadProductImage(selectedFile) : group.image;
                colors.push({ color: group.color, image, sizes: group.sizes });
                if (selectedFile) {
                    selectedVariantFiles.current.delete(group.id);
                    releasePreview(group.image);
                    setProductForm((currentForm) => ({
                        ...currentForm,
                        colors: currentForm.colors.map((currentColor) => currentColor.id === group.id
                            ? { ...currentColor, image }
                            : currentColor),
                    }));
                }
            }

            const variants = colors.flatMap(({ color, image, sizes }) => sizes.map(({ size, stock }) => ({
                color,
                size,
                stock: Number(stock),
                ...(image ? { image } : {}),
            })));
            const productData = {
                categoryId: productForm.categoryId,
                category: category.label,
                description: productForm.description.trim(),
                images,
                name: productForm.name.trim(),
                price: Number(productForm.price),
                sku: product.sku || `MSN-${String(products.length + 101).padStart(3, "0")}`,
                status: productForm.status,
                variants,
            };
            const savedProduct = await updateAdminProduct(product.id, productData);
            const savedWithColors = {
                ...savedProduct,
                colors,
                category: category.label,
                image: images[0] || colors.find(({ image: colorImage }) => colorImage)?.image || product.image || "",
            };

            setProducts((currentProducts) => currentProducts.map((currentProduct) => (
                currentProduct.id === product.id ? savedWithColors : currentProduct
            )));
            cleanupPreviews();
            onSaved();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Could not save the product.");
        } finally {
            setIsUploadingImages(false);
        }
    };

    return (
        <ProductFormModal
            categories={categories}
            closeProductModal={cancelEditing}
            editingProductId={product.id}
            isUploadingImages={isUploadingImages}
            productForm={productForm}
            removeImage={removeImage}
            removeColor={removeColor}
            removeSize={removeSize}
            saveProduct={saveProduct}
            setProductForm={setProductForm}
            addColor={addColor}
            addSize={addSize}
            updateColor={updateColor}
            updateSize={updateSize}
            uploadImages={uploadImages}
            uploadVariantImage={uploadVariantImage}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            createCategory={createCategory}
            categoryError={categoryError}
            formError={formError}
            inline
        />
    );
};

export default AdminProductInlineEditor;
