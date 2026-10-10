import { createContext, useContext } from "react";

export const AdminDataContext = createContext(null);

export const useAdminData = () => {
    const context = useContext(AdminDataContext);
    if (!context) {
        throw new Error("useAdminData must be used inside AdminDataProvider.");
    }
    return context;
};
