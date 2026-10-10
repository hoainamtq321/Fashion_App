// frontend/api/Product.js
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getDb } from "../lib/firebaseAdmin.js";

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const requireAdmin = async (req, res) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    sendError(res, 401, "Bạn cần đăng nhập để thực hiện thao tác này.");
    return false;
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token, true);

    if (decodedToken.admin !== true) {
      sendError(res, 403, "Bạn không có quyền quản trị.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Không xác minh được token quản trị:", error);
    sendError(res, 401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    return false;
  }
};

const validateProduct = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Dữ liệu sản phẩm không hợp lệ." };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const categoryId =
    typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : categoryId;
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const price =
    body.price === "" || body.price === null ? NaN : Number(body.price);
  const status = body.status;

  if (!name) {
    return { error: "Tên sản phẩm không được để trống." };
  }

  if (!categoryId) {
    return { error: "Vui lòng chọn danh mục sản phẩm." };
  }

  if (!Number.isInteger(price) || price < 0) {
    return { error: "Giá sản phẩm phải là số nguyên không âm." };
  }

  if (status !== "active" && status !== "draft") {
    return { error: "Trạng thái sản phẩm không hợp lệ." };
  }

  const images = body.images ?? [];
  if (
    !Array.isArray(images) ||
    images.length > 4 ||
    images.some((image) => typeof image !== "string")
  ) {
    return { error: "Danh sách ảnh không hợp lệ; tối đa 4 ảnh." };
  }

  const variants = body.variants ?? [];
  if (!Array.isArray(variants)) {
    return { error: "Danh sách biến thể không hợp lệ." };
  }

  const normalizedVariants = [];

  for (const variant of variants) {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
      return { error: "Thông tin biến thể không hợp lệ." };
    }

    const color = typeof variant.color === "string" ? variant.color.trim() : "";
    const size = typeof variant.size === "string" ? variant.size.trim() : "";
    const stock =
      variant.stock === "" || variant.stock === null
        ? NaN
        : Number(variant.stock);

    if (
      !color ||
      !size ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      (variant.image !== undefined && typeof variant.image !== "string")
    ) {
      return {
        error: "Mỗi biến thể cần có màu, size và tồn kho hợp lệ.",
      };
    }

    normalizedVariants.push({
      color,
      size,
      stock,
      ...(variant.image ? { image: variant.image.trim() } : {}),
    });
  }

  return {
    product: {
      name,
      categoryId,
      category,
      ...(sku ? { sku } : {}),
      description,
      price,
      status,
      images: images.map((image) => image.trim()).filter(Boolean),
      variants: normalizedVariants,
    },
  };
};

const serializeProduct = (doc) => {
  const data = doc.data();

  const toIsoString = (value) => {
    if (typeof value?.toDate === "function") {
      return value.toDate().toISOString();
    }

    return typeof value === "string" ? value : null;
  };

  return {
    id: doc.id,
    ...data,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
};

const getProductId = (req) => {
  const id = req.query?.id;
  return typeof id === "string" ? id.trim() : "";
};

export default async function handler(req, res) {
  const supportedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  if (!supportedMethods.includes(req.method)) {
    res.setHeader("Allow", supportedMethods);
    return sendError(res, 405, "Phương thức này chưa được hỗ trợ.");
  }

  res.setHeader("Cache-Control", "no-store");

  try {
    const db = getDb();
    const productsRef = db.collection("products");

    if (req.method === "GET") {
      const includeAll = req.query?.all === "true";

      if (includeAll && !(await requireAdmin(req, res))) {
        return;
      }

      const snapshot = includeAll
        ? await productsRef.get()
        : await productsRef.where("status", "==", "active").get();
      const products = snapshot.docs.map(serializeProduct);

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    }

    if (!(await requireAdmin(req, res))) {
      return;
    }

    if (req.method === "POST") {
      const result = validateProduct(req.body);

      if (result.error) {
        return sendError(res, 400, result.error);
      }

      const now = FieldValue.serverTimestamp();
      const docRef = await productsRef.add({
        ...result.product,
        createdAt: now,
        updatedAt: now,
      });

      const savedDoc = await docRef.get();

      return res.status(201).json({
        success: true,
        message: "Thêm sản phẩm thành công.",
        data: serializeProduct(savedDoc),
      });
    }

    const productId = getProductId(req);

    if (!productId) {
      return sendError(res, 400, "Thiếu id sản phẩm.");
    }

    const productRef = productsRef.doc(productId);
    const existingProduct = await productRef.get();

    if (!existingProduct.exists) {
      return sendError(res, 404, "Không tìm thấy sản phẩm.");
    }

    if (req.method === "PUT") {
      const result = validateProduct(req.body);

      if (result.error) {
        return sendError(res, 400, result.error);
      }

      await productRef.update({
        ...result.product,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await productRef.get();

      return res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công.",
        data: serializeProduct(updatedDoc),
      });
    }

    if (req.method === "PATCH") {
      const status = req.body?.status;

      if (status !== "active" && status !== "draft") {
        return sendError(res, 400, "Trạng thái sản phẩm không hợp lệ.");
      }

      await productRef.update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await productRef.get();

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái sản phẩm thành công.",
        data: serializeProduct(updatedDoc),
      });
    }

    await productRef.delete();

    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công.",
      id: productId,
    });
  } catch (error) {
    console.error("Lỗi API quản lý sản phẩm:", error);
    return sendError(res, 500, "Không thể xử lý yêu cầu quản lý sản phẩm.");
  }
}