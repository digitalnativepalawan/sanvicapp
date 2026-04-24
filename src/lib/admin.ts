import { createContext, useContext } from "react";

export const AdminContext = createContext<boolean>(false);
export const useAdmin = () => useContext(AdminContext);