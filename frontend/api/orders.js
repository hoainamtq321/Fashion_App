import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getDb } from "../lib/firebaseAdmin.js";
import { ORDER_STATUS_CATALOG, ORDER_STATUS_TRANSITIONS } from "../lib/orderStatusCatalog.js";

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const requireAuthenticatedUser = async (req, res) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    sendError(res, 401, "Bạn cần đăng nhập để thực hiện thao tác này.");
    return null;
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token, true);
    return decodedToken;
  } catch (error) {
    console.error("Không xác minh được token quản trị:", error);
    sendError(res, 401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    return null;
  }
};

const serializeOrder = (doc) => {
  const data = doc.data();
  const toIsoString = (value) => (
    typeof value?.toDate === "function"
      ? value.toDate().toISOString()
      : typeof value === "string" ? value : null
  );

  return {
    id: doc.id,
    ...data,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
};

const validateOrder = (body, { requireRequestId = true } = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Order details are invalid." };
  }

  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  const customer = body.customer;
  const name = typeof customer?.name === "string" ? customer.name.trim() : "";
  const phone = typeof customer?.phone === "string" ? customer.phone.trim() : "";
  const address = typeof customer?.address === "string" ? customer.address.trim() : "";
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "Cash on delivery";
  const rawItems = body.items;

  if (requireRequestId && !/^[a-zA-Z0-9_-]{10,80}$/.test(requestId)) {
    return { error: "The order request identifier is invalid." };
  }
  if (!name || name.length > 120) {
    return { error: "Enter a customer name (up to 120 characters)." };
  }
  if (!/^[+\d() .-]{7,24}$/.test(phone)) {
    return { error: "Enter a valid customer phone number." };
  }
  if (customerId && !/^[a-zA-Z0-9_-]{1,128}$/.test(customerId)) {
    return { error: "The customer account identifier is invalid." };
  }
  if (!address || address.length > 500) {
    return { error: "Enter a delivery address (up to 500 characters)." };
  }
  if (!["Cash", "Bank transfer", "Cash on delivery", "Other"].includes(paymentMethod)) {
    return { error: "The payment method is invalid." };
  }
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 100) {
    return { error: "An order must contain between 1 and 100 item lines." };
  }

  const items = [];
  for (const item of rawItems) {
    const productId = typeof item?.productId === "string" ? item.productId.trim() : "";
    const color = typeof item?.color === "string" ? item.color.trim() : "";
    const size = typeof item?.size === "string" ? item.size.trim() : "";
    const quantity = Number(item?.quantity);
    if (
      !/^[a-zA-Z0-9_-]{1,150}$/.test(productId) || !color || !size ||
      !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000
    ) {
      return { error: "Each order line needs a product, color, size, and positive whole quantity." };
    }
    items.push({ productId, color, size, quantity });
  }

  return {
    order: {
      ...(requestId ? { requestId } : {}),
      customer: { name, phone, address },
      ...(customerId ? { customerId } : {}),
      paymentMethod,
      items,
    },
  };
};

const normalizeVariantOption = (value) => String(value || "").trim().toLocaleLowerCase();

export default async function handler(req, res) {
  const supportedMethods = ["GET", "POST", "PATCH"];
  if (!supportedMethods.includes(req.method)) {
    res.setHeader("Allow", supportedMethods);
    return sendError(res, 405, "Phương thức này chưa được hỗ trợ.");
  }

  res.setHeader("Cache-Control", "no-store");

  const identity = await requireAuthenticatedUser(req, res);
  if (!identity) return;
  const isAdmin = identity.admin === true;
  if (req.method === "PATCH" && !isAdmin) {
    return sendError(res, 403, "Bạn không có quyền quản trị.");
  }

  try {
    const db = getDb();
    const ordersRef = db.collection("orders");
    const orderId = typeof req.query?.id === "string" ? req.query.id.trim() : "";
    if (orderId && !/^[a-zA-Z0-9_-]{1,150}$/.test(orderId)) {
      return sendError(res, 400, "Mã đơn hàng không hợp lệ.");
    }

    if (req.method === "GET") {
      if (orderId) {
        const orderDoc = await ordersRef.doc(orderId).get();
        if (!orderDoc.exists) return sendError(res, 404, "Không tìm thấy đơn hàng.");
        if (!isAdmin && orderDoc.data().customerId !== identity.uid) {
          return sendError(res, 404, "Không tìm thấy đơn hàng.");
        }
        return res.status(200).json({ success: true, data: serializeOrder(orderDoc) });
      }

      const snapshot = isAdmin
        ? await ordersRef.get()
        : await ordersRef.where("customerId", "==", identity.uid).get();
      const orders = snapshot.docs
        .map(serializeOrder)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.status(200).json({ success: true, count: orders.length, data: orders });
    }

    if (req.method === "POST") {
      const result = validateOrder(req.body);
      if (result.error) return sendError(res, 400, result.error);

      if (!isAdmin && req.body.paymentMethod !== undefined && req.body.paymentMethod !== "Cash on delivery") {
        return sendError(res, 400, "Khách hàng chỉ có thể đặt đơn thanh toán khi nhận hàng.");
      }

      const {
        requestId,
        customer,
        customerId: requestedCustomerId,
        paymentMethod: requestedPaymentMethod,
        items,
      } = result.order;
      const customerId = isAdmin ? requestedCustomerId : identity.uid;
      const paymentMethod = isAdmin ? requestedPaymentMethod : "Cash on delivery";
      const orderRef = ordersRef.doc(requestId);
      const productIds = [...new Set(items.map(({ productId }) => productId))];
      const productRefs = productIds.map((productId) => db.collection("products").doc(productId));

      if (req.query?.quote === "true") {
        const quote = await db.runTransaction(async (transaction) => {
          const productDocs = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));
          const productsById = new Map(productDocs.map((productDoc) => [productDoc.id, productDoc]));
          const variantsByProduct = new Map();
          const orderItems = [];

          for (const item of items) {
            const productDoc = productsById.get(item.productId);
            if (!productDoc?.exists) {
              const error = new Error(`Product ${item.productId} was not found.`);
              error.status = 404;
              throw error;
            }

            const product = productDoc.data();
            if (product.status !== "active") {
              const error = new Error(`${product.name || "A product"} is not available for sale.`);
              error.status = 409;
              throw error;
            }

            const variants = variantsByProduct.get(item.productId) || (Array.isArray(product.variants) ? [...product.variants] : []);
            const variantIndex = variants.findIndex((variant) => (
              normalizeVariantOption(variant.color) === normalizeVariantOption(item.color) &&
              normalizeVariantOption(variant.size) === normalizeVariantOption(item.size)
            ));
            if (variantIndex < 0) {
              const error = new Error(`${product.name || "A product"} no longer has ${item.color} / ${item.size}.`);
              error.status = 409;
              throw error;
            }

            const variant = variants[variantIndex];
            if (!Number.isSafeInteger(Number(variant.stock)) || Number(variant.stock) < item.quantity) {
              const error = new Error(`Insufficient stock for ${product.name} — ${item.color} / ${item.size}.`);
              error.status = 409;
              throw error;
            }

            variants[variantIndex] = { ...variant, stock: Number(variant.stock) - item.quantity };
            variantsByProduct.set(item.productId, variants);
            orderItems.push({
              productId: item.productId,
              name: product.name || "",
              sku: product.sku || "",
              image: variant.image || product.images?.[0] || "",
              color: variant.color,
              size: variant.size,
              price: Number(product.price),
              quantity: item.quantity,
            });
          }

          if (orderItems.some(({ price }) => !Number.isSafeInteger(price) || price < 0)) {
            const error = new Error("A product has an invalid price and cannot be ordered.");
            error.status = 409;
            throw error;
          }
          const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          if (!Number.isSafeInteger(total)) {
            const error = new Error("The order total exceeds the supported amount.");
            error.status = 400;
            throw error;
          }
          return { items: orderItems, total };
        });

        return res.status(200).json({ success: true, data: quote });
      }

      const expectedTotal = req.body?.expectedTotal;
      if (!isAdmin && (!Number.isSafeInteger(expectedTotal) || expectedTotal < 0)) {
        return sendError(res, 400, "Please review the current order total before placing your order.");
      }

      const order = await db.runTransaction(async (transaction) => {
        const existingOrder = await transaction.get(orderRef);
        if (existingOrder.exists) {
          if (!isAdmin && existingOrder.data().customerId !== identity.uid) {
            const error = new Error("The order request identifier is already in use.");
            error.status = 409;
            throw error;
          }
          return serializeOrder(existingOrder);
        }

        const productDocs = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));
        const productsById = new Map(productDocs.map((productDoc) => [productDoc.id, productDoc]));
        const variantsByProduct = new Map();
        const orderItems = [];

        for (const item of items) {
          const productDoc = productsById.get(item.productId);
          if (!productDoc?.exists) {
            const error = new Error(`Product ${item.productId} was not found.`);
            error.status = 404;
            throw error;
          }

          const product = productDoc.data();
          if (product.status !== "active") {
            const error = new Error(`${product.name || "A product"} is not available for sale.`);
            error.status = 409;
            throw error;
          }

          const variants = variantsByProduct.get(item.productId) || (Array.isArray(product.variants) ? [...product.variants] : []);
          const variantIndex = variants.findIndex((variant) => (
            normalizeVariantOption(variant.color) === normalizeVariantOption(item.color) &&
            normalizeVariantOption(variant.size) === normalizeVariantOption(item.size)
          ));
          if (variantIndex < 0) {
            const error = new Error(`${product.name || "A product"} no longer has ${item.color} / ${item.size}.`);
            error.status = 409;
            throw error;
          }

          const variant = variants[variantIndex];
          if (!Number.isSafeInteger(Number(variant.stock)) || Number(variant.stock) < item.quantity) {
            const error = new Error(`Insufficient stock for ${product.name} — ${item.color} / ${item.size}.`);
            error.status = 409;
            throw error;
          }

          variants[variantIndex] = { ...variant, stock: Number(variant.stock) - item.quantity };
          variantsByProduct.set(item.productId, variants);
          orderItems.push({
            productId: item.productId,
            name: product.name || "",
            sku: product.sku || "",
            image: variant.image || product.images?.[0] || "",
            color: variant.color,
            size: variant.size,
            price: Number(product.price),
            quantity: item.quantity,
          });
        }

        if (orderItems.some(({ price }) => !Number.isSafeInteger(price) || price < 0)) {
          const error = new Error("A product has an invalid price and cannot be ordered.");
          error.status = 409;
          throw error;
        }

        const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (!Number.isSafeInteger(total)) {
          const error = new Error("The order total exceeds the supported amount.");
          error.status = 400;
          throw error;
        }
        if (!isAdmin && expectedTotal !== total) {
          const error = new Error("Product prices or availability changed. Review your order total and try again.");
          error.status = 409;
          throw error;
        }

        const now = FieldValue.serverTimestamp();
        const orderData = {
          customer,
          ...(customerId ? { customerId } : {}),
          items: orderItems,
          subtotal: total,
          shippingFee: 0,
          discount: 0,
          total,
          currency: "VND",
          status: "Pending",
          paymentStatus: "Unpaid",
          paymentMethod,
          source: isAdmin ? "admin" : "storefront",
          ...(isAdmin ? { createdBy: identity.uid } : {}),
          createdAt: now,
          updatedAt: now,
        };

        variantsByProduct.forEach((variants, productId) => {
          transaction.update(db.collection("products").doc(productId), {
            variants,
            updatedAt: now,
          });
        });
        transaction.create(orderRef, orderData);
        return { id: requestId, ...orderData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      });

      return res.status(201).json({ success: true, message: "Đơn hàng đã được tạo.", data: order });
    }

    if (!orderId) return sendError(res, 400, "Thiếu mã đơn hàng.");
    const orderRef = ordersRef.doc(orderId);
    if (
      req.body?.paymentStatus !== undefined ||
      req.body?.items !== undefined ||
      req.body?.customer !== undefined ||
      req.body?.paymentMethod !== undefined
    ) {
      const nextPaymentStatus = req.body.paymentStatus;
      if (nextPaymentStatus !== undefined && !["Unpaid", "Paid", "Refunded"].includes(nextPaymentStatus)) {
        return sendError(res, 400, "Trạng thái thanh toán không hợp lệ.");
      }

      if (req.body?.items !== undefined || req.body?.customer !== undefined || req.body?.paymentMethod !== undefined) {
        const result = validateOrder(req.body, { requireRequestId: false });
        if (result.error) return sendError(res, 400, result.error);
        const { customer, customerId, paymentMethod, items } = result.order;

        await db.runTransaction(async (transaction) => {
          const orderDoc = await transaction.get(orderRef);
          if (!orderDoc.exists) {
            const error = new Error("Không tìm thấy đơn hàng.");
            error.status = 404;
            throw error;
          }

          const currentOrder = orderDoc.data();
          if (
            !["Pending", "Processing"].includes(currentOrder.status) ||
            (currentOrder.paymentStatus || "Unpaid") !== "Unpaid"
          ) {
            const error = new Error("Chỉ có thể sửa đơn chưa thanh toán và chưa giao hoặc hủy.");
            error.status = 409;
            throw error;
          }

          const productIds = [...new Set([
            ...(currentOrder.items || []).map(({ productId }) => productId),
            ...items.map(({ productId }) => productId),
          ])];
          const productRefs = productIds.map((productId) => db.collection("products").doc(productId));
          const productDocs = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));
          const productsById = new Map(productDocs.map((productDoc) => [productDoc.id, productDoc]));
          const variantsByProduct = new Map();

          for (const item of currentOrder.items || []) {
            const productDoc = productsById.get(item.productId);
            if (!productDoc?.exists) continue;
            const product = productDoc.data();
            const variants = variantsByProduct.get(item.productId) || [...(product.variants || [])];
            const variantIndex = variants.findIndex((variant) => (
              normalizeVariantOption(variant.color) === normalizeVariantOption(item.color) &&
              normalizeVariantOption(variant.size) === normalizeVariantOption(item.size)
            ));
            if (variantIndex < 0) continue;
            variants[variantIndex] = {
              ...variants[variantIndex],
              stock: Number(variants[variantIndex].stock || 0) + Number(item.quantity || 0),
            };
            variantsByProduct.set(item.productId, variants);
          }

          const orderItems = [];
          for (const item of items) {
            const productDoc = productsById.get(item.productId);
            if (!productDoc?.exists) {
              const error = new Error(`Product ${item.productId} was not found.`);
              error.status = 404;
              throw error;
            }

            const product = productDoc.data();
            const isExistingProduct = (currentOrder.items || []).some(({ productId }) => productId === item.productId);
            if (product.status !== "active" && !isExistingProduct) {
              const error = new Error(`${product.name || "A product"} is not available for sale.`);
              error.status = 409;
              throw error;
            }

            const variants = variantsByProduct.get(item.productId) || [...(product.variants || [])];
            const variantIndex = variants.findIndex((variant) => (
              normalizeVariantOption(variant.color) === normalizeVariantOption(item.color) &&
              normalizeVariantOption(variant.size) === normalizeVariantOption(item.size)
            ));
            if (variantIndex < 0) {
              const error = new Error(`${product.name || "A product"} no longer has ${item.color} / ${item.size}.`);
              error.status = 409;
              throw error;
            }
            const variant = variants[variantIndex];
            if (!Number.isSafeInteger(Number(variant.stock)) || Number(variant.stock) < item.quantity) {
              const error = new Error(`Insufficient stock for ${product.name} — ${item.color} / ${item.size}.`);
              error.status = 409;
              throw error;
            }
            variants[variantIndex] = { ...variant, stock: Number(variant.stock) - item.quantity };
            variantsByProduct.set(item.productId, variants);
            orderItems.push({
              productId: item.productId,
              name: product.name || "",
              sku: product.sku || "",
              image: variant.image || product.images?.[0] || "",
              color: variant.color,
              size: variant.size,
              price: Number(product.price),
              quantity: item.quantity,
            });
          }

          if (orderItems.some(({ price }) => !Number.isSafeInteger(price) || price < 0)) {
            const error = new Error("A product has an invalid price and cannot be ordered.");
            error.status = 409;
            throw error;
          }
          const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const shippingFee = Number(currentOrder.shippingFee || 0);
          const discount = Number(currentOrder.discount || 0);
          const total = subtotal + shippingFee - discount;
          if (![subtotal, total].every(Number.isSafeInteger) || total < 0) {
            const error = new Error("The order total exceeds the supported amount.");
            error.status = 400;
            throw error;
          }

          const now = FieldValue.serverTimestamp();
          variantsByProduct.forEach((variants, productId) => {
            transaction.update(db.collection("products").doc(productId), { variants, updatedAt: now });
          });
          transaction.update(orderRef, {
            customer,
            ...(customerId ? { customerId } : {}),
            paymentMethod,
            items: orderItems,
            subtotal,
            total,
            updatedAt: now,
          });
        });

        const updatedDoc = await orderRef.get();
        return res.status(200).json({
          success: true,
          message: "Cập nhật đơn hàng thành công.",
          data: serializeOrder(updatedDoc),
        });
      }

      if (nextPaymentStatus === undefined) {
        return sendError(res, 400, "Trạng thái thanh toán không hợp lệ.");
      }

      await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists) {
          const error = new Error("Không tìm thấy đơn hàng.");
          error.status = 404;
          throw error;
        }

        const currentOrder = orderDoc.data();
        const currentStatus = currentOrder.paymentStatus || "Unpaid";
        if (currentStatus === nextPaymentStatus) return;
        const allowedPaymentTransitions = { Unpaid: ["Paid"], Paid: ["Refunded"], Refunded: [] };
        if (
          !allowedPaymentTransitions[currentStatus]?.includes(nextPaymentStatus) ||
          (currentOrder.status === "Cancelled" && nextPaymentStatus !== "Refunded")
        ) {
          const error = new Error("Không thể chuyển trạng thái thanh toán sang giá trị đã chọn.");
          error.status = 409;
          throw error;
        }
        transaction.update(orderRef, {
          paymentStatus: nextPaymentStatus,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      const updatedDoc = await orderRef.get();
      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thanh toán thành công.",
        data: serializeOrder(updatedDoc),
      });
    }

    const nextStatus = req.body?.status;
    if (!ORDER_STATUS_CATALOG.some(({ value }) => value === nextStatus)) {
      return sendError(res, 400, "Trạng thái đơn hàng không hợp lệ.");
    }

    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        const error = new Error("Không tìm thấy đơn hàng.");
        error.status = 404;
        throw error;
      }

      const currentOrder = orderDoc.data();
      if (currentOrder.status === nextStatus) return;
      if (!ORDER_STATUS_TRANSITIONS[currentOrder.status]?.includes(nextStatus)) {
        const error = new Error("Không thể chuyển đơn hàng từ trạng thái hiện tại sang trạng thái đã chọn.");
        error.status = 409;
        throw error;
      }
      if (nextStatus === "Cancelled" && currentOrder.paymentStatus === "Paid") {
        const error = new Error("Hoàn tiền trước khi hủy đơn đã thanh toán.");
        error.status = 409;
        throw error;
      }

      const now = FieldValue.serverTimestamp();
      if (nextStatus === "Cancelled") {
        const productIds = [...new Set((currentOrder.items || []).map(({ productId }) => productId))];
        const productRefs = productIds.map((productId) => db.collection("products").doc(productId));
        const productDocs = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));
        const docsById = new Map(productDocs.map((productDoc) => [productDoc.id, productDoc]));
        const restoredVariants = new Map();

        for (const item of currentOrder.items || []) {
          const productDoc = docsById.get(item.productId);
          if (!productDoc?.exists) continue;
          const variants = restoredVariants.get(item.productId) || [...(productDoc.data().variants || [])];
          const variantIndex = variants.findIndex((variant) => (
            normalizeVariantOption(variant.color) === normalizeVariantOption(item.color) &&
            normalizeVariantOption(variant.size) === normalizeVariantOption(item.size)
          ));
          if (variantIndex >= 0) {
            variants[variantIndex] = {
              ...variants[variantIndex],
              stock: Number(variants[variantIndex].stock || 0) + Number(item.quantity || 0),
            };
            restoredVariants.set(item.productId, variants);
          }
        }
        restoredVariants.forEach((variants, productId) => {
          transaction.update(db.collection("products").doc(productId), { variants, updatedAt: now });
        });
      }

      transaction.update(orderRef, { status: nextStatus, updatedAt: now });
    });

    const updatedDoc = await orderRef.get();
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công.",
      data: serializeOrder(updatedDoc),
    });
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);
    console.error("Lỗi API quản lý đơn hàng:", error);
    return sendError(res, 500, "Không thể xử lý yêu cầu quản lý đơn hàng.");
  }
}
