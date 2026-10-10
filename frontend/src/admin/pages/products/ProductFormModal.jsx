import styles from "../../components/AdminShared.module.css";

const ProductFormModal = ({
    categories,
    closeProductModal,
    editingProductId,
    isUploadingImages,
    productForm,
    removeImage,
    removeColor,
    removeSize,
    saveProduct,
    setProductForm,
    addColor,
    addSize,
    updateColor,
    updateSize,
    uploadImages,
    uploadVariantImage,
    categoryName,
    setCategoryName,
    createCategory,
    categoryError,
    formError,
}) => (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && closeProductModal()}>
        <form className={styles.modal} onSubmit={saveProduct}>
            <div className={styles.modalHeading}>
                <div><p className={styles.panelEyebrow}>Catalog</p><h2>{editingProductId ? "Edit product" : "Add product"}</h2></div>
                <button type="button" className={styles.closeButton} onClick={closeProductModal} disabled={isUploadingImages} aria-label="Close">×</button>
            </div>
            <label>
                Product name
                <input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} placeholder="e.g. Oversized T-Shirt" />
            </label>
            <div className={styles.formRow}>
                <label>
                    Category
                    <select value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}>
                        {categories.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
                    </select>
                </label>
                <label>
                    Price (VND)
                    <input required min="0" step="1" type="number" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
                </label>
                {editingProductId && (
                    <label>
                        Status
                        <select value={productForm.status} onChange={(event) => setProductForm({ ...productForm, status: event.target.value })}>
                            <option value="active">Active</option><option value="draft">Draft</option>
                        </select>
                    </label>
                )}
            </div>
            <div className={styles.categoryCreator}>
                <label htmlFor="new-product-category">Create category</label>
                <div className={styles.categoryCreatorRow}>
                    <input
                        id="new-product-category"
                        value={categoryName}
                        onChange={(event) => setCategoryName(event.target.value)}
                        placeholder="Category name"
                    />
                    <button className={styles.secondaryButton} type="button" onClick={createCategory} disabled={isUploadingImages}>Add category</button>
                </div>
                {categoryError && <p className={styles.formMessage} role="status">{categoryError}</p>}
            </div>
            <label>
                Description
                <textarea required value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} placeholder="Áo thun form rộng phong cách casual" rows="3" />
            </label>
            <div className={styles.variantHeading}><span>Product images (up to 4)</span></div>
            <div className={styles.mainImageSlots}>
                {productForm.images.map((image, index) => (
                    <label className={styles.imageSlot} key={`${index}-${image}`}>
                        <input className={styles.fileInput} type="file" accept="image/*" onChange={uploadImages} disabled={isUploadingImages || Boolean(image)} />
                        <span>{image ? <img src={image} alt={`Main product ${index + 1}`} /> : `Add image ${index + 1}`}</span>
                        {image && (
                            <button
                                className={styles.removeImageButton}
                                type="button"
                                onClick={(event) => { event.preventDefault(); removeImage(index); }}
                                aria-label={`Remove image ${index + 1}`}
                            >×</button>
                        )}
                    </label>
                ))}
            </div>
            <div className={styles.variantHeading}>
                <span>Colors and sizes</span>
                <button className={styles.textButton} type="button" onClick={addColor} disabled={isUploadingImages}>+ Add color</button>
            </div>
            <div className={styles.colorGroupList}>
                {productForm.colors.map((group, colorIndex) => (
                    <section className={styles.colorGroup} key={group.id}>
                        <div className={styles.colorGroupHeading}>
                            <label className={styles.colorNameField}>
                                Color
                                <input
                                    required
                                    value={group.color}
                                    onChange={(event) => updateColor(group.id, "color", event.target.value)}
                                    placeholder="e.g. Black"
                                />
                            </label>
                            <label className={styles.variantImageButton}>
                                <input
                                    className={styles.fileInput}
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => uploadVariantImage(event, group.id)}
                                    disabled={isUploadingImages}
                                />
                                <span>{group.image ? "Change color image" : "Add color image"}</span>
                            </label>
                            {group.image && <img className={styles.variantThumb} src={group.image} alt={`${group.color || `Color ${colorIndex + 1}`} preview`} />}
                            <button
                                className={styles.removeVariantButton}
                                type="button"
                                onClick={() => removeColor(group.id)}
                                aria-label={`Remove color ${colorIndex + 1}`}
                            >×</button>
                        </div>
                        <div className={styles.sizeList}>
                            {group.sizes.map((size, sizeIndex) => (
                                <div className={styles.sizeRow} key={`${group.id}-${sizeIndex}`}>
                                    <label>
                                        Size
                                        <input
                                            required
                                            value={size.size}
                                            onChange={(event) => updateSize(group.id, sizeIndex, "size", event.target.value)}
                                            placeholder="e.g. M"
                                        />
                                    </label>
                                    <label>
                                        Quantity
                                        <input
                                            required
                                            min="0"
                                            step="1"
                                            type="number"
                                            value={size.stock}
                                            onChange={(event) => updateSize(group.id, sizeIndex, "stock", event.target.value)}
                                            placeholder="Stock"
                                        />
                                    </label>
                                    {group.sizes.length > 1 && (
                                        <button className={styles.removeSizeButton} type="button" onClick={() => removeSize(group.id, sizeIndex)} aria-label={`Remove size ${sizeIndex + 1}`}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className={styles.textButton} type="button" onClick={() => addSize(group.id)}>+ Add size</button>
                    </section>
                ))}
            </div>
            {formError && <p className={styles.formMessage} role="alert">{formError}</p>}
            <div className={styles.modalActions}>
                <button className={styles.cancelButton} type="button" onClick={closeProductModal} disabled={isUploadingImages}>Cancel</button>
                <button className={styles.primaryButton} disabled={isUploadingImages} type="submit">{isUploadingImages ? "Uploading images..." : editingProductId ? "Save changes" : "Add product"}</button>
            </div>
        </form>
    </div>
);

export default ProductFormModal;
