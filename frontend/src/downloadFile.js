import axios from "axios";

// POSTs to an export endpoint and saves the file it returns (Excel or ZIP). The name comes from the
// server's Content-Disposition header. Errors come back as a blob; their JSON message is rethrown.
export const downloadFile = async (url, body, fallbackName = "export") => {
  try {
    const res = await axios.post(url, body, { withCredentials: true, responseType: "blob" });
    const disposition = res.headers["content-disposition"] || "";
    const name = /filename="?([^"]+)"?/.exec(disposition)?.[1] || fallbackName;
    const href = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(href), 1000);
    return name;
  } catch (err) {
    let message = "The download failed, please try again";
    try {
      const text = await err.response?.data?.text?.();
      message = JSON.parse(text).message || message;
    } catch {
      // not a JSON error body
    }
    throw new Error(message);
  }
};
