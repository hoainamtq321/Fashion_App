
import { useState } from "react";

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../../services/firebase";
import { useNavigate, Link } from 'react-router-dom';

import styles from "./AuthPage.module.css";

const Login = () => {
    const navigate = useNavigate();

    // 1. Khởi tạo state để lưu trữ thông tin đăng nhập
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        // 3. Sử dụng thông tin đã lưu trong state để gửi đi
        console.log("Thông tin chuẩn bị gửi lên:", { email, password });
        
        setLoading(true);
        setError('');

        try {
            // Gửi thông tin đăng nhập lên Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Đăng nhập thành công:", userCredential.user);

            // Đăng nhập thành công thì chuyển hướng về trang chủ
            navigate('/'); 

        } catch (err) {
            console.error("Lỗi đăng nhập:", err.code);
            // Xử lý các mã lỗi phổ biến của Firebase trả về
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Email hoặc mật khẩu không chính xác.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Định dạng email không hợp lệ.');
            } else {
                setError('Đã có lỗi xảy ra, vui lòng thử lại sau.');
            }
            } finally {
                setLoading(false);
        }

    };

    return (
        <section className={styles.page}>
            <div className={styles.shell}>
                <aside className={styles.visual}>
                    <div className={styles.visualContent}>
                        <p className={styles.eyebrow}>The new collection</p>
                        <h1 className={styles.visualTitle}>Dress for the life you want.</h1>
                        <p className={styles.visualCopy}>Thoughtful pieces for everyday rituals, made to move with you.</p>
                    </div>
                </aside>

                <div className={styles.formPanel} onSubmit={handleSubmit}>
                    <form className={styles.form} >
                        <header className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Welcome back</h2>
                            <p className={styles.formSubtitle}>Sign in to continue your style story.</p>
                            {/* Hiển thị thông báo lỗi nếu có */}
                            {error && <div className="alert alert-danger">{error}</div>}
                        </header>

                        <div className={styles.fields}>
                            
                            <label className={styles.field} htmlFor="login-email">
                                EMAIL ADDRESS
                                <input 
                                    className={styles.input} 
                                    id="login-email" 
                                    name="email" 
                                    type="email" 
                                    placeholder="you@example.com" 
                                    autoComplete="email" 
                                    // 2.1 Cập nhật state khi người dùng nhập email
                                    onChange={(e) => setEmail(e.target.value)} 
                                />
                            </label>
                            <label className={styles.field} htmlFor="login-password">
                                PASSWORD
                                <input 
                                    className={styles.input} 
                                    id="login-password" 
                                    name="password" 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    autoComplete="current-password" 
                                    required 
                                    // 2.2 Cập nhật state khi người dùng nhập mật khẩu
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </label>
                        </div>

                        <div className={styles.formOptions}>
                            <label className={styles.remember}>
                                <input type="checkbox" name="remember" />
                                Remember me
                            </label>
                            <button className={styles.linkButton} type="button">Forgot password?</button>
                        </div>

                        <button className={styles.submit} type="submit">Sign in</button>
                        <p className={styles.switch}>New here?</p>
                        <Link className={styles.switchButton} to="/register">Create an account</Link>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Login;