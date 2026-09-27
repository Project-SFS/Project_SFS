// import { Get_cookies } from "../../backend/controllers/Cookie"

import axios from "axios";

const URL = import.meta.env.VITE_API_URL
const resolveFileUrl = (filePath) => {
    if (!filePath) return "";

    const file = String(filePath).trim().replace(/\\/g, "/");
    if (/^(https?:|blob:|data:)/i.test(file)) return file;

    const apiBase = (URL || "").replace(/\/+$/, "");
    if (file.startsWith("/uploads/") || file.startsWith("uploads/")) {
        return `${apiBase}/${file.replace(/^\/+/, "")}`;
    }

    if (file.startsWith("/")) return `${window.location.origin}${file}`;
    return `${apiBase}/${file}`;
}
const auth = async () => {

    try {
        const res = await axios.get(`${URL}/cookie`, { withCredentials: true });
        // console.log(res.data.ROLE);
        return { role: res.data.ROLE, name: res.data.NAME };
    } catch (error) {
        console.error("Error during auth:", error);
        return null;
    }
};


export { URL, auth, resolveFileUrl }