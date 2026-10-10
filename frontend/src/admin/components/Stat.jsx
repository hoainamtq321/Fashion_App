import styles from "./AdminShared.module.css";

const Stat = ({ label, value, note, trend, warning }) => (
    <div className={styles.statCard}>
        <span className={styles.statLabel}>{label}<b className={warning ? styles.warning : ""}>{trend}</b></span>
        <strong>{value}</strong>
        <small>{note}</small>
    </div>
);

export default Stat;
