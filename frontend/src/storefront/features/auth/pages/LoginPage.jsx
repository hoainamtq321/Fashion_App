import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuthErrorMessage, sendPasswordReset, signInWithEmail } from "../services/authService";
import styles from "./AuthPage.module.css";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = location.state?.from;
    const destination = returnTo
        ? `${returnTo.pathname || "/"}${returnTo.search || ""}${returnTo.hash || ""}`
        : "/";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await signInWithEmail({ email, password, rememberMe });
            navigate(destination, { replace: true });
        } catch (signInError) {
            setError(getAuthErrorMessage(signInError, "login"));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        setError("");
        setMessage("");
        if (!email.trim()) {
            setError("Nhập email của bạn trước khi yêu cầu đặt lại mật khẩu.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordReset(email);
            setMessage("Nếu email này đã đăng ký, Firebase sẽ gửi hướng dẫn đặt lại mật khẩu.");
        } catch (resetError) {
            setError(getAuthErrorMessage(resetError, "reset"));
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

                <div className={styles.formPanel}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <header className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Welcome back</h2>
                            <p className={styles.formSubtitle}>Sign in to continue your style story.</p>
                            {error && <p className="alert alert-danger" role="alert">{error}</p>}
                            {message && <p role="status">{message}</p>}
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
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
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
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                            </label>
                        </div>

                        <div className={styles.formOptions}>
                            <label className={styles.remember}>
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={rememberMe}
                                    onChange={(event) => setRememberMe(event.target.checked)}
                                />
                                Remember me
                            </label>
                            <button className={styles.linkButton} type="button" onClick={handlePasswordReset} disabled={loading}>
                                Forgot password?
                            </button>
                        </div>

                        <button className={styles.submit} type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                        <p className={styles.switch}>New here?</p>
                        <Link className={styles.switchButton} to="/register" state={{ from: returnTo }}>Create an account</Link>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Login;
