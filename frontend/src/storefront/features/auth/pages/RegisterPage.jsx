import { useState } from "react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../../../services/firebase";
import { ensureCustomerProfile, getAuthErrorMessage, registerWithEmail } from "../services/authService";
import styles from "./AuthPage.module.css";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = location.state?.from;
    const destination = returnTo
        ? `${returnTo.pathname || "/"}${returnTo.search || ""}${returnTo.hash || ""}`
        : "/";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [canRetryProfile, setCanRetryProfile] = useState(false);

    useEffect(() => {
        if (auth.currentUser) navigate("/", { replace: true });
    }, [navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setCanRetryProfile(false);

        try {
            await registerWithEmail({ name, email, password });
            navigate(destination, { replace: true });
        } catch (registerError) {
            setError(getAuthErrorMessage(registerError, "register"));
            setCanRetryProfile(registerError?.code === "auth/profile-write-failed");
        } finally {
            setLoading(false);
        }
    };

    const retryProfileSave = async () => {
        if (!auth.currentUser) {
            setError("Phiên đăng nhập không còn hoạt động. Hãy đăng nhập bằng tài khoản vừa tạo để lưu hồ sơ.");
            setCanRetryProfile(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            await ensureCustomerProfile(auth.currentUser, name.trim());
            navigate(destination, { replace: true });
        } catch (profileError) {
            const wrappedError = {
                code: "auth/profile-write-failed",
                causeCode: profileError?.code,
            };
            setError(getAuthErrorMessage(wrappedError, "register"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.page}>
            <div className={styles.shell}>
                <aside className={styles.visual}>
                    <div className={styles.visualContent}>
                        <p className={styles.eyebrow}>A wardrobe, considered</p>
                        <h1 className={styles.visualTitle}>Find your everyday signature.</h1>
                        <p className={styles.visualCopy}>Join a community that believes getting dressed can be an art.</p>
                    </div>
                </aside>

                <div className={styles.formPanel}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <header className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Create account</h2>
                            <p className={styles.formSubtitle}>Start building a wardrobe that feels like you.</p>
                            {error && <p className="alert alert-danger" role="alert">{error}</p>}
                            {canRetryProfile && (
                                <button className={styles.linkButton} type="button" onClick={retryProfileSave} disabled={loading}>
                                    Retry saving customer profile
                                </button>
                            )}
                        </header>

                        <div className={styles.fields}>
                            <label className={styles.field} htmlFor="register-name">
                                FULL NAME
                                <input
                                    className={styles.input}
                                    id="register-name"
                                    name="name"
                                    type="text"
                                    placeholder="Your name"
                                    autoComplete="name"
                                    maxLength="120"
                                    required
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                />
                            </label>
                            <label className={styles.field} htmlFor="register-email">
                                EMAIL ADDRESS
                                <input
                                    className={styles.input}
                                    id="register-email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </label>
                            <label className={styles.field} htmlFor="register-password">
                                PASSWORD
                                <input
                                    className={styles.input}
                                    id="register-password"
                                    name="password"
                                    type="password"
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                    minLength="8"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                            </label>
                        </div>

                        <div className={styles.formOptions}>
                            <label className={styles.remember}>
                                <input type="checkbox" name="terms" required />
                                I agree to the terms
                            </label>
                        </div>

                        <button className={styles.submit} type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                        <p className={styles.switch}>Already a member?</p>
                        <Link className={styles.switchButton} to="/login" state={{ from: returnTo }}>Sign in</Link>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Register;
