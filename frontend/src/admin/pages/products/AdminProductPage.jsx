import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fakeProducts } from "../../../shared/data/mockProducts";
import { useAdminData } from "../../context/AdminDataContext";
import { ProductTable } from "../../components/AdminTables";
import PanelHeading from "../../components/PanelHeading";
import ProductFormModal from "./ProductFormModal";
import { createColorGroup, createEmptyProductForm, getColorGroups } from "./productFormUtils";
import styles from "../../components/AdminShared.module.css";
import { createAdminProduct, updateAdminProduct, uploadProductImage } from "../../services/adminProductsApi";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const ProductsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        products,
        categories,
        addCategory,
        setProducts,
        deleteProduct,
        toggleProductStatus,
        isLoadingProducts,
        productsError,
        clearProductsError,
    } = useAdminData();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All status");
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [productForm, setProductForm] = useState(createEmptyProductForm);
    const [selectedImageFiles, setSelectedImageFiles] = useState({});
    const [selectedVariantFiles, setSelectedVariantFiles] = useState({});
    const [categoryName, setCategoryName] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [formError, setFormError] = useState("");
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const filteredProducts = useMemo(() => products.filter((product) => {
        const matchesSearch = `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (statusFilter === "All status" || product.status === statusFilter);
    }), [products, search, statusFilter]);

    const openAddProduct = () => {
        setEditingProductId(null);
        setProductForm(createEmptyProductForm());
        setSelectedImageFiles({});
        setSelectedVariantFiles({});
        setCategoryName("");
        setCategoryError("");
        setFormError("");
        setModalOpen(true);
    };

    const openEditProduct = useCallback((product) => {
        setEditingProductId(product.id);
        setProductForm({
            name: product.name,
            categoryId: product.categoryId || "cat_ao",
            description: product.description || "",
            price: product.price,
            status: product.status === "Draft" ? "draft" : "active",
            images: [...(product.images || [product.image || ""]).filter(Boolean).slice(0, 4), ""].slice(0, 4),
            colors: getColorGroups(product),
        });
        setSelectedImageFiles({});
        setSelectedVariantFiles({});
        setCategoryName("");
        setCategoryError("");
        setFormError("");
        setModalOpen(true);
    }, []);

    // Reconcile the detail page's edit request with the product form after navigation.
    useEffect(() => {
        const { editProductId } = location.state || {};
        if (!editProductId || isLoadingProducts) return;

        const productToEdit = products.find(({ id }) => id === editProductId);
        // oxlint-disable-next-line react/set-state-in-effect
        if (productToEdit) openEditProduct(productToEdit);
        navigate(location.pathname, { replace: true, state: null });
    }, [isLoadingProducts, location.pathname, location.state, navigate, openEditProduct, products]);

    const closeProductModal = () => {
        if (isUploadingImages) return;
        Object.keys(selectedImageFiles).forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
        Object.keys(selectedVariantFiles).forEach((colorId) => {
            const color = productForm.colors.find(({ id }) => id === colorId);
            if (color?.image?.startsWith("blob:")) URL.revokeObjectURL(color.image);
        });
        setModalOpen(false);
        setEditingProductId(null);
        setCategoryName("");
        setCategoryError("");
        setFormError("");
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
        if (removedColor?.image?.startsWith("blob:")) URL.revokeObjectURL(removedColor.image);
        setProductForm((currentForm) => ({
            ...currentForm,
            colors: currentForm.colors.filter(({ id }) => id !== colorId),
        }));
        setSelectedVariantFiles((currentFiles) => {
            const nextFiles = { ...currentFiles };
            delete nextFiles[colorId];
            return nextFiles;
        });
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
        if (image && selectedImageFiles[image]) {
            URL.revokeObjectURL(image);
            setSelectedImageFiles((currentFiles) => {
                const nextFiles = { ...currentFiles };
                delete nextFiles[image];
                return nextFiles;
            });
        }
        setProductForm((currentForm) => ({
            ...currentForm,
            images: [...currentForm.images.filter((image, imageIndex) => imageIndex !== index && image), ""],
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

        const imageFiles = {};
        const previews = selectedFiles.map((file) => {
            const preview = URL.createObjectURL(file);
            imageFiles[preview] = file;
            return preview;
        });
        if (files.length > remainingSlots) setFormError("A product can have up to 4 main images; extra files were not added.");
        else setFormError("");
        setSelectedImageFiles((currentFiles) => ({ ...currentFiles, ...imageFiles }));
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
        if (previousColor?.image?.startsWith("blob:")) URL.revokeObjectURL(previousColor.image);
        const preview = URL.createObjectURL(file);
        updateColor(colorId, "image", preview);
        setSelectedVariantFiles((currentFiles) => ({ ...currentFiles, [colorId]: file }));
        setFormError("");
        event.target.value = "";
    };

    const createCategory = (event) => {
        event.preventDefault();
        const label = categoryName.trim();
        if (!label) {
            setCategoryError("Enter a category name.");
            return;
        }

        const { category, created } = addCategory(label);
        if (!created) {
            setCategoryError("This category already exists. It has been selected.");
        } else {
            setCategoryError("");
        }
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
                const file = selectedImageFiles[image];
                const uploadedUrl = file ? await uploadProductImage(file) : image;
                images.push(uploadedUrl);
                if (file) {
                    setProductForm((currentForm) => ({
                        ...currentForm,
                        images: currentForm.images.map((currentImage) => currentImage === image ? uploadedUrl : currentImage),
                    }));
                    setSelectedImageFiles((currentFiles) => {
                        const nextFiles = { ...currentFiles };
                        delete nextFiles[image];
                        return nextFiles;
                    });
                    URL.revokeObjectURL(image);
                }
            }

            const colors = [];
            for (const group of normalizedColors) {
                const selectedFile = selectedVariantFiles[group.id];
                const image = selectedFile ? await uploadProductImage(selectedFile) : group.image;
                colors.push({ color: group.color, image, sizes: group.sizes });
                if (selectedFile) {
                    updateColor(group.id, "image", image);
                    setSelectedVariantFiles((currentFiles) => {
                        const nextFiles = { ...currentFiles };
                        delete nextFiles[group.id];
                        return nextFiles;
                    });
                    URL.revokeObjectURL(group.image);
                }
            }

            const variants = colors.flatMap(({ color, image, sizes }) => sizes.map(({ size, stock }) => ({
                color,
                size,
                stock: Number(stock),
                ...(image ? { image } : {}),
            })));
            const existingProduct = products.find(({ id }) => id === editingProductId);
            const productData = {
                categoryId: productForm.categoryId,
                category: category.label,
                description: productForm.description.trim(),
                images,
                name: productForm.name.trim(),
                price: Number(productForm.price),
                sku: existingProduct?.sku || `MSN-${String(products.length + 101).padStart(3, "0")}`,
                status: productForm.status,
                variants,
            };
            const savedProduct = editingProductId
                ? await updateAdminProduct(editingProductId, productData)
                : await createAdminProduct(productData);
            const productWithFormColors = {
                ...savedProduct,
                colors,
                category: category.label,
                image: images[0] || colors.find(({ image }) => image)?.image || fakeProducts[0].image,
            };

            setProducts((currentProducts) => editingProductId
                ? currentProducts.map((product) => product.id === editingProductId ? productWithFormColors : product)
                : [productWithFormColors, ...currentProducts]);
            setIsUploadingImages(false);
            closeProductModal();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Could not save the product.");
        } finally {
            setIsUploadingImages(false);
        }
    };

    return (
        <>
            <section className={styles.tableSection}>
                {productsError && <p className={styles.formMessage} role="alert">{productsError}</p>}
                {isLoadingProducts && <p className={styles.muted}>Loading products…</p>}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or SKU" /></div>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                        <option>All status</option><option>Active</option><option>Draft</option>
                    </select>
                    <button className={styles.primaryButton} type="button" onClick={openAddProduct}>+ Add product</button>
                </div>
                <section className={styles.panel}>
                    <PanelHeading eyebrow="Catalog" title="All products" action={`${filteredProducts.length} results`} />
                    <ProductTable products={filteredProducts} onToggleStatus={toggleProductStatus} onEdit={openEditProduct} onDelete={deleteProduct} />
                </section>
            </section>

            {isModalOpen && (
                <ProductFormModal
                    categories={categories}
                    closeProductModal={closeProductModal}
                    editingProductId={editingProductId}
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
                />
            )}
        </>
    );
};

export default ProductsPage;
