import { randomUUID } from "node:crypto";
import { getAdminAuth } from "../lib/firebaseAdmin.js";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/]+={0,2})$/;
const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const requireAdmin = async (req, res) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    sendError(res, 401, "Bạn cần đăng nhập để tải ảnh sản phẩm.");
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
    console.error("Không xác minh được token quản trị khi tải ảnh:", error);
    sendError(res, 401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Phương thức này chưa được hỗ trợ.");
  }

  res.setHeader("Cache-Control", "no-store");

  if (!(await requireAdmin(req, res))) {
    return;
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, "Thiếu cấu hình IMGBB_API_KEY trên môi trường máy chủ.");
  }

  const imageData = req.body?.image;
  if (typeof imageData !== "string") {
    return sendError(res, 400, "Thiếu dữ liệu ảnh.");
  }

  const match = IMAGE_DATA_URL_PATTERN.exec(imageData);
  if (!match) {
    return sendError(res, 400, "Ảnh phải là JPEG, PNG, WebP, GIF hoặc AVIF hợp lệ.");
  }

  const [, mimeType, base64Image] = match;
  const imageBuffer = Buffer.from(base64Image, "base64");
  if (imageBuffer.toString("base64") !== base64Image) {
    return sendError(res, 400, "Dữ liệu ảnh mã hóa không hợp lệ.");
  }
  if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
    return sendError(res, 413, "Mỗi ảnh phải có dung lượng tối đa 3 MB.");
  }

  const uploadUrl = new URL("https://api.imgbb.com/1/upload");
  uploadUrl.searchParams.set("key", apiKey);

  const originalName = typeof req.body.name === "string"
    ? req.body.name.split(/[\\/]/).pop()
    : "";
  const nameWithoutExtension = originalName.replace(/\.[^.]*$/, "");
  const safeName = nameWithoutExtension
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "image";
  const uniqueName = `${safeName}-${randomUUID()}.${IMAGE_EXTENSIONS[mimeType]}`;

  const formData = new FormData();
  formData.set("image", base64Image);
  formData.set("name", uniqueName);

  let response;
  try {
    response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    console.error("Không thể kết nối tới ImgBB:", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: error?.cause?.code || "unknown",
    });
    return sendError(res, 502, "Server không kết nối được tới ImgBB. Kiểm tra mạng server rồi thử lại.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    console.error("ImgBB trả về phản hồi không phải JSON:", response.status);
    return sendError(res, 502, "ImgBB trả về phản hồi không hợp lệ.");
  }

  if (!response.ok || result.success !== true || typeof result.data?.url !== "string") {
    console.error("ImgBB từ chối yêu cầu tải ảnh:", {
      httpStatus: response.status,
      apiStatus: result.status || null,
      errorCode: result.error?.code || null,
    });
    return sendError(res, 502, "ImgBB từ chối ảnh. Kiểm tra API key, định dạng và dung lượng ảnh.");
  }

  return res.status(200).json({
    success: true,
    data: {
      url: result.data.url,
      mimeType,
    },
  });
}
