import { Link } from "react-router-dom";
import styles from "./AdminShared.module.css";

const PanelHeading = ({ eyebrow, title, action, onClick, to }) => (
    <div className={styles.panelHeading}>
        <div><p className={styles.panelEyebrow}>{eyebrow}</p><h2>{title}</h2></div>
        {action && (to
            ? <Link className={styles.textButton} to={to}>{action}</Link>
            : <button className={styles.textButton} type="button" onClick={onClick}>{action}</button>)}
    </div>
);

export default PanelHeading;
