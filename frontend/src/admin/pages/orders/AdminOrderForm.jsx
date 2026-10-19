import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import styles from "../../components/AdminShared.module.css";

const createLine = (productId = "", variantIndex = "", quantity = 1) => ({
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    variantIndex,
    quantity,
});

const AdminOrderForm = ({ initialOrder, onCancel, onSaved }) => {
    const { products, updateOrder, isLoadingProducts, productsError } = useAdminData();
    const availableProducts = products.filter(({ id, status }) => (
        status === "Active" || initialOrder?.items?.some((item) => item.productId === id)
    ));
    const [customer, setCustomer] = useState(() => ({
        name: initialOrder?.customer?.name || "",
        phone: initialOrder?.customer?.phone || "",
        address: initialOrder?.customer?.address || "",
    }));
    const [paymentMethod, setPaymentMethod] = useState(initialOrder?.paymentMethod || "Cash on delivery");
    const [lines, setLines] = useState(() => initialOrder?.items?.length
        ? initialOrder.items.map((item) => {
            return createLine(item.productId, "", item.quantity);
        })
        : [createLine()]);
    const initializedVariants = useRef(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!initialOrder || isLoadingProducts || initializedVariants.current) return;
        setLines((currentLines) => currentLines.map((line, index) => {
            const item = initialOrder.items[index];
            const product = products.find(({ id }) => id === item?.productId);
            const variantIndex = product?.variants?.findIndex((variant) => (
                variant.color === item?.color && variant.size === item?.size
            ));
            return { ...line, variantIndex: variantIndex >= 0 ? String(variantIndex) : "" };
        }));
        initializedVariants.current = true;
    }, [initialOrder, isLoadingProducts, products]);

    const subtotal = useMemo(() => lines.reduce((total, line) => {
        const product = products.find(({ id }) => id === line.productId);
        return total + (Number(product?.price || 0) * Number(line.quantity || 0));
    }, 0), [lines, products]);

    const updateLine = (lineId, changes) => {
        setLines((currentLines) => currentLines.map((line) => line.id === lineId ? { ...line, ...changes } : line));
    };

    const addLine = () => setLines((currentLines) => [...currentLines, createLine()]);

    const removeLine = (lineId) => {
        setLines((currentLines) => currentLines.length > 1
            ? currentLines.filter(({ id }) => id !== lineId)
            : currentLines);
    };

    const getVariants = (line) => {
        const product = availableProducts.find(({ id }) => id === line.productId);
        return (product?.variants || []).map((variant, index) => {
            const reservedByOrder = initialOrder?.items?.reduce((total, item) => (
                item.productId === line.productId && item.color === variant.color && item.size === variant.size
                    ? total + Number(item.quantity || 0)
                    : total
            ), 0) || 0;
            return { ...variant, index, availableStock: Number(variant.stock || 0) + reservedByOrder };
        });
    };

    const submitOrder = async (event) => {
        event.preventDefault();
        setError("");

        const invalidLine = lines.some((line) => {
            const variant = getVariants(line).find(({ index }) => String(index) === String(line.variantIndex));
            return !line.productId || !variant || !Number.isSafeInteger(Number(line.quantity)) || Number(line.quantity) < 1;
        });
        if (invalidLine) {
            setError("Choose a product and variant and enter a positive whole quantity for every line.");
            return;
        }

        setIsSaving(true);
        try {
            const orderData = {
                customer: {
                    name: customer.name.trim(),
                    phone: customer.phone.trim(),
                    address: customer.address.trim(),
                },
                paymentMethod,
                items: lines.map((line) => {
                    const variant = getVariants(line).find(({ index }) => String(index) === String(line.variantIndex));
                    return {
                        productId: line.productId,
                        color: variant.color,
                        size: variant.size,
                        quantity: Number(line.quantity),
                    };
                }),
            };
            const order = await updateOrder(initialOrder.id, orderData);
            onSaved(order);
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Could not create the order.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form className={styles.orderForm} onSubmit={submitOrder}>
            <div className={styles.orderFormHeader}>
                <div><p className={styles.panelEyebrow}>Sales activity</p><h2>Edit order</h2></div>
                <span>Amounts are calculated from the current product prices in VND.</span>
            </div>

            <section className={styles.orderFormSection}>
                <h3 className={styles.detailSectionTitle}>Customer and delivery</h3>
                <div className={styles.orderCustomerGrid}>
                    <label>Customer name<input required maxLength="120" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} /></label>
                    <label>Phone<input required type="tel" maxLength="24" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} /></label>
                    <label>Payment method
                        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                            <option>Cash on delivery</option><option>Cash</option><option>Bank transfer</option><option>Other</option>
                        </select>
                    </label>
                    <label className={styles.orderAddress}>Delivery address<textarea required maxLength="500" rows="2" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} /></label>
                </div>
            </section>

            <section className={styles.orderFormSection}>
                <div className={styles.orderLinesHeading}>
                    <h3 className={styles.detailSectionTitle}>Products</h3>
                    <button className={styles.textButton} type="button" onClick={addLine} disabled={lines.length >= 100}>+ Add product</button>
                </div>
                {productsError && <p className={styles.formMessage} role="alert">{productsError}</p>}
                {isLoadingProducts && <p className={styles.muted} role="status">Loading products…</p>}
                {!isLoadingProducts && availableProducts.length === 0 && <p className={styles.formMessage}>There are no active products to add to this order.</p>}
                <div className={styles.orderLines}>
                    {lines.map((line) => {
                        const selectedProduct = availableProducts.find(({ id }) => id === line.productId);
                        const variants = getVariants(line);
                        const selectedVariant = variants.find(({ index }) => String(index) === String(line.variantIndex));
                        return (
                            <div className={styles.orderLine} key={line.id}>
                                <label>Product
                                    <select
                                        required
                                        value={line.productId}
                                        onChange={(event) => updateLine(line.id, { productId: event.target.value, variantIndex: "" })}
                                    >
                                        <option value="">Select product</option>
                                        {availableProducts.map((product) => (
                                            <option value={product.id} key={product.id}>{product.name} — {product.sku || product.id}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>Color / size
                                    <select
                                        required
                                        value={line.variantIndex}
                                        onChange={(event) => updateLine(line.id, { variantIndex: event.target.value })}
                                        disabled={!selectedProduct || variants.length === 0}
                                    >
                                        <option value="">Select variant</option>
                                        {variants.map((variant) => (
                                            <option value={variant.index} key={`${variant.color}-${variant.size}-${variant.index}`} disabled={variant.availableStock < 1}>
                                                {variant.color} / {variant.size} ({variant.availableStock} in stock)
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>Quantity
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max={selectedVariant ? selectedVariant.availableStock : undefined}
                                        step="1"
                                        value={line.quantity}
                                        onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                                    />
                                </label>
                                <strong className={styles.orderLineTotal}>
                                    {((Number(selectedProduct?.price) || 0) * (Number(line.quantity) || 0)).toLocaleString("vi-VN")} ₫
                                </strong>
                                <button className={styles.removeOrderLine} type="button" onClick={() => removeLine(line.id)} disabled={lines.length === 1} aria-label="Remove product line">×</button>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className={styles.orderFormSummary}>
                <span>Shipping fee: Complimentary</span>
                <strong>Total: {subtotal.toLocaleString("vi-VN")} ₫</strong>
                <span>Payment status: Unpaid</span>
            </div>
            {error && <p className={styles.formMessage} role="alert">{error}</p>}
            <div className={styles.modalActions}>
                <button className={styles.cancelButton} type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
                <button className={styles.primaryButton} type="submit" disabled={isSaving || isLoadingProducts || availableProducts.length === 0}>
                    {isSaving ? "Saving changes..." : "Save changes"}
                </button>
            </div>
        </form>
    );
};

export default AdminOrderForm;
