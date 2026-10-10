import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <section className={styles.brand}>
                    <Link className={styles.logo} to="/">Maison</Link>
                    <p className={styles.intro}>
                        Maison là không gian thời trang trực tuyến dành cho những thiết kế
                        hiện đại, tinh giản và được chọn lọc để đồng hành cùng phong cách
                        sống mỗi ngày.
                    </p>
                </section>

                <section>
                    <h2 className={styles.heading}>Khám phá</h2>
                    <nav className={styles.links} aria-label="Footer navigation">
                        <Link className={styles.link} to="/">Trang chủ</Link>
                        <Link className={styles.link} to="/?collection=new-arrivals">Bộ sưu tập mới</Link>
                        <Link className={styles.link} to="/?collection=sale">Ưu đãi</Link>
                    </nav>
                </section>

                <section>
                    <h2 className={styles.heading}>Tài khoản</h2>
                    <nav className={styles.links} aria-label="Account navigation">
                        <Link className={styles.link} to="/login">Đăng nhập</Link>
                        <Link className={styles.link} to="/register">Đăng ký</Link>
                        <Link className={styles.link} to="/profile">Hồ sơ cá nhân</Link>
                    </nav>
                </section>

                <section>
                    <h2 className={styles.heading}>Về dự án</h2>
                    <div className={styles.contact}>
                        <span>Thời trang có chủ đích, thiết kế cho đời sống thật.</span>
                        <a href="mailto:hello@maison.local">hello@maison.local</a>
                        <span>Hỗ trợ: Thứ 2 - Thứ 6, 9:00 - 18:00</span>
                    </div>
                </section>
            </div>

            <div className={styles.bottom}>
                <span>© 2026 Maison. All rights reserved.</span>
                <span>Made with care for everyday style.</span>
            </div>
        </footer>
    );
}

export default Footer;