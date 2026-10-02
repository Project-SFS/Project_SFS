// Problem statement categories: the stored value (lower case) and the label people see.
export const CATEGORIES = {
    software: "Software",
    hardware: "Hardware",
    combined: "Combined (Hardware + Software)",
};
export const CATEGORY_KEYS = Object.keys(CATEGORIES);
export const CATEGORY_CHOICES = ["Software", "Hardware", "Combined"]; // what the Excel dropdown offers

// Reads what someone typed (Excel cell or form) into a category key, or null when it is not one.
// Tolerant to case and common wording: "SW", "Hardware & Software", "Both", "Hybrid", ...
export const parseCategory = (value) => {
    const t = String(value ?? "").toLowerCase().replace(/[^a-z]/g, " ").replace(/\s+/g, " ").trim();
    if (!t) return null;
    const hasHw = /\b(hardware|hw)\b/.test(t);
    const hasSw = /\b(software|sw)\b/.test(t);
    if (/\b(combined|combination|both|hybrid|mixed)\b/.test(t) || (hasHw && hasSw)) return "combined";
    if (hasSw) return "software";
    if (hasHw) return "hardware";
    return null;
};
