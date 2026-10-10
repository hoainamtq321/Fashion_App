import { Link } from "react-router-dom";
import { useState } from "react";

import styles from "./AuthPage.module.css";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Thông tin chuẩn bị gửi lên:", { name, email, password });
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

                <div className={styles.formPanel} onSubmit={handleSubmit}>
                    <form className={styles.form}>
                        <header className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Create account</h2>
                            <p className={styles.formSubtitle}>Start building a wardrobe that feels like you.</p>
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
                                    required 
                                    onChange={(e) => setName(e.target.value)} 
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
                                    onChange={(e) => setEmail(e.target.value)} 
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
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </label>
                        </div>

                        <div className={styles.formOptions}>
                            <label className={styles.remember}>
                                <input type="checkbox" name="terms" required />
                                I agree to the terms
                            </label>
                        </div>

                        <button className={styles.submit} type="submit">Create account</button>
                        <p className={styles.switch}>Already a member?</p>
                        <Link className={styles.switchButton} to="/login">Sign in</Link>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Register;