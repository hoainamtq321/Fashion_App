import {
    browserLocalPersistence,
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../../../services/firebase";

const normalizeEmail = (email) => email.trim().toLowerCase();

export const ensureCustomerProfile = async (user, displayName = user.displayName || "") => {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);
    if (profileSnapshot.exists()) return;

    await setDoc(profileRef, {
        uid: user.uid,
        displayName,
        email: user.email || "",
        role: "customer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

const saveCustomerProfile = async (user, displayName) => {
    try {
        await ensureCustomerProfile(user, displayName);
    } catch (cause) {
        const error = new Error("The account exists, but its customer profile could not be saved.");
        error.code = "auth/profile-write-failed";
        error.causeCode = cause?.code;
        error.cause = cause;
        throw error;
    }
};

export const registerWithEmail = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
    await saveCustomerProfile(credential.user, name.trim());
    return credential.user;
};

export const signInWithEmail = async ({ email, password, rememberMe }) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    await saveCustomerProfile(credential.user);
    return credential.user;
};

export const sendPasswordReset = (email) =>
    sendPasswordResetEmail(auth, normalizeEmail(email));

export const getAuthErrorMessage = (error, operation) => {
    switch (error?.code) {
        case "auth/email-already-in-use":
            return "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.";
        case "auth/invalid-email":
            return "Địa chỉ email không hợp lệ.";
        case "auth/weak-password":
            return "Mật khẩu chưa đủ mạnh. Hãy dùng mật khẩu dài ít nhất 6 ký tự.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Email hoặc mật khẩu không chính xác.";
        case "auth/user-disabled":
            return "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ cửa hàng.";
        case "auth/too-many-requests":
            return "Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.";
        case "auth/network-request-failed":
            return "Không thể kết nối. Hãy kiểm tra mạng và thử lại.";
        case "auth/operation-not-allowed":
            return "Đăng nhập bằng email/mật khẩu chưa được bật trong Firebase Authentication.";
        case "auth/profile-write-failed":
            if (error.causeCode === "permission-denied") {
                return "Tài khoản đăng nhập đã được tạo nhưng Firestore từ chối lưu hồ sơ. Hãy triển khai Firestore Rules từ file firestore.rules rồi thử lưu lại.";
            }
            if (error.causeCode === "failed-precondition") {
                return "Tài khoản đăng nhập đã được tạo nhưng Firestore chưa sẵn sàng. Hãy tạo Firestore Database trong đúng Firebase project rồi thử lưu lại.";
            }
            if (error.causeCode === "unavailable" || error.causeCode === "auth/network-request-failed") {
                return "Tài khoản đăng nhập đã được tạo nhưng chưa kết nối được Firestore. Kiểm tra mạng rồi thử lưu lại.";
            }
            return `Tài khoản đăng nhập đã được tạo nhưng chưa lưu được hồ sơ khách hàng trong Firestore${error.causeCode ? ` (${error.causeCode})` : ""}. Kiểm tra cấu hình Firestore rồi thử lại.`;
        default:
            return operation === "register"
                ? "Không thể tạo tài khoản lúc này. Vui lòng thử lại."
                : operation === "reset"
                    ? "Không thể gửi email đặt lại mật khẩu lúc này. Vui lòng thử lại."
                    : "Không thể đăng nhập lúc này. Vui lòng thử lại.";
    }
};
