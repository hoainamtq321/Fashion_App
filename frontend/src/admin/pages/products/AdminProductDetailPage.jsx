import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import AdminProductInlineEditor from "./AdminProductInlineEditor";
import styles from "../../components/AdminShared.module.css";

const statusClass = (status) => status.toLowerCase().replace(" ", "-");

const AdminProductDetailPage = () => {
    const { productId } = useParams();
    const { products, isLoadingProducts, productsError } = useAdminData();
    const [isEditing, setIsEditing] = useState(false);
    const product = products.find(({ id }) => id === productId);

    if (isLoadingProducts) {
        return <p className={styles.muted} role="status" aria-busy="true">Loading product details…</p>;
    }

    if (productsError) {
        return (
            <section className={styles.productDetail}>
                <p className={styles.formMessage} role="alert">{productsError}</p>
                <Link className={styles.backLink} to="/admin/products">Back to products</Link>
            </section>
        );
    }

    if (!product) {
        return (
            <section className={styles.productDetail}>
                <p className={styles.panelEyebrow}>Catalog</p>
                <h2 className={styles.detailTitle}>Product not found</h2>
                <p className={styles.muted}>This product may have been removed or is not available.</p>
                <Link className={styles.backLink} to="/admin/products">Back to products</Link>
            </section>
        );
    }

    const variantRows = Array.isArray(product.variants)
        ? product.variants
        : (product.colors || []).flatMap(({ color, name, sizes = [], image }) => sizes.map(({ size, stock }) => ({
            color: color || name || "",
            size,
            stock,
            image,
        })));
    const images = [...new Set([
        ...(Array.isArray(product.images) ? product.images : []),
        ...variantRows.map(({ image }) => image),
    ].filter(Boolean))];
    const totalStock = variantRows.reduce((total, { stock }) => total + Number(stock || 0), 0);

    return (
        <section className={styles.productDetail}>
            <div className={styles.detailToolbar}>
                <Link className={styles.backLink} to="/admin/products">← Back to products</Link>
                {!isEditing && <button className={styles.primaryButton} type="button" onClick={() => setIsEditing(true)}>Edit product</button>}
            </div>

            {isEditing ? (
                <AdminProductInlineEditor
                    product={product}
                    onCancel={() => setIsEditing(false)}
                    onSaved={() => setIsEditing(false)}
                />
            ) : (
                <>
                    <div className={styles.detailHeader}>
                        <div>
                            <p className={styles.panelEyebrow}>Product details</p>
                            <h2 className={styles.detailTitle}>{product.name}</h2>
                            <p className={styles.muted}>{product.sku || product.id}</p>
                        </div>
                        <span className={`${styles.status} ${styles[statusClass(product.status)]}`}>{product.status}</span>
                    </div>

                    <div className={styles.detailGrid}>
                        <section className={`${styles.panel} ${styles.detailImagesPanel}`} aria-label="Product images">
                            <h3 className={styles.detailSectionTitle}>Images</h3>
                            {images.length ? (
                                <div className={styles.detailImages}>
                                    {images.map((image, index) => (
                                        <img key={image} src={image} alt={`${product.name} ${index + 1}`} />
                                    ))}
                                </div>
                            ) : <p className={styles.muted}>No product images.</p>}
                        </section>

                        <section className={`${styles.panel} ${styles.detailInfoPanel}`}>
                            <h3 className={styles.detailSectionTitle}>Overview</h3>
                            <dl className={styles.detailInfo}>
                                <div><dt>Category</dt><dd>{product.category || product.categoryId || "—"}</dd></div>
                                <div><dt>Price</dt><dd>${Number(product.price || 0).toLocaleString()}</dd></div>
                                <div><dt>Total stock</dt><dd>{totalStock} units</dd></div>
                            </dl>
                            <div className={styles.detailDescription}>
                                <h4>Description</h4>
                                <p>{product.description || "No description provided."}</p>
                            </div>
                        </section>
                    </div>

                    <section className={`${styles.panel} ${styles.detailVariantsPanel}`}>
                        <div className={styles.detailVariantsHeading}>
                            <h3 className={styles.detailSectionTitle}>Variants</h3>
                            <span>{variantRows.length} {variantRows.length === 1 ? "variant" : "variants"}</span>
                        </div>
                        <div className={styles.tableWrap}>
                            <table>
                                <thead><tr><th>Color</th><th>Size</th><th>Quantity</th></tr></thead>
                                <tbody>
                                    {variantRows.map((variant, index) => (
                                        <tr key={`${variant.color}-${variant.size}-${index}`}>
                                            <td>{variant.color || "—"}</td>
                                            <td>{variant.size || "—"}</td>
                                            <td>{Number(variant.stock || 0)} units</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {variantRows.length === 0 && <div className={styles.noResults}>No variants configured.</div>}
                        </div>
                    </section>
                </>
            )}
        </section>
    );
};

export default AdminProductDetailPage;
