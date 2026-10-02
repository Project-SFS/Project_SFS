import axios from "axios";
import { FiFileText, FiMonitor } from "react-icons/fi";
import { URL } from "./Utils";

// Solution files: up to 3 per submission, each a PDF or PowerPoint (.pptx) of at most 20 MB
// (same limits as backend utils/submissionFiles.js)
export const MAX_FILES = 3;
export const MAX_FILE_MB = 20;
export const ACCEPT = ".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const kindOf = (name) => {
  const n = String(name || "").toLowerCase();
  return n.endsWith(".pdf") ? "PDF" : n.endsWith(".pptx") ? "PPTX" : null;
};
export const KIND_LABEL = { PDF: "PDF", PPTX: "PowerPoint" };
export const formatSize = (bytes) =>
  !bytes ? "" : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// login-protected address of a stored file (PDFs open in the browser, PowerPoint files download)
export const fileHref = (file) => `${URL}/${file.PATH}`;

// Full address of the backend on this site: "/api" becomes https://your-domain/api, so links work
// on whatever domain or IP the site is opened on
const apiBase = () => (/^https?:\/\//i.test(URL) ? URL : `${window.location.origin}${URL}`).replace(/\/+$/, "");

// Signed share link for one file (works without login until it expires)
export const createShareLink = async (fileId) => {
  const res = await axios.post(`${URL}/submission_files/${fileId}/share`, {}, { withCredentials: true });
  return { url: `${apiBase()}/shared/file/${res.data.token}`, days: res.data.days, expiresAt: res.data.expiresAt };
};

// Microsoft's online viewer can show a .pptx only when it can download it, i.e. on a public domain
export const isPublicSite = () => {
  const h = window.location.hostname;
  return !(h === "localhost" || h.endsWith(".local") || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^\[?::1\]?$/.test(h));
};
export const officeViewerUrl = (publicFileUrl) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicFileUrl)}`;

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers / non-secure pages
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
};

// Compact list of a submission's files with links (team and SPOC views)
export const FileLinks = ({ files = [], className = "" }) => {
  if (!files.length) return <span className="text-xs text-gray-400">No files</span>;
  return (
    <ul className={`space-y-1 ${className}`}>
      {files.map((f) => {
        const Icon = f.KIND === "PPTX" ? FiMonitor : FiFileText;
        return (
          <li key={f.ID} className="flex items-center gap-1.5 text-sm min-w-0">
            <Icon className={`shrink-0 ${f.KIND === "PPTX" ? "text-orange-600" : "text-red-500"}`} />
            <a href={fileHref(f)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate" title={f.NAME}>{f.NAME}</a>
            <span className="text-xs text-gray-400 shrink-0">{KIND_LABEL[f.KIND] || f.KIND}{f.SIZE_BYTES ? ` · ${formatSize(f.SIZE_BYTES)}` : ""}</span>
          </li>
        );
      })}
    </ul>
  );
};
