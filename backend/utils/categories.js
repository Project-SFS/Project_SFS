// Challenge categories: the stored value (lower case) and the label people see.
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

// A team's interests: any of the category keys, stored comma-separated (e.g. "hardware,combined").
// Accepts an array or text such as "Hardware, Software" / "Hardware & Combined" / "all".
// A list item may itself be a category in loose wording ("HW", "Both"), but "hardware, software" stays two
// interests (it is not read as one Combined).
export const parseInterests = (value) => {
    const parts = Array.isArray(value) ? value : String(value ?? "").split(/[,;/|&+\n]|\band\b/i);
    const keys = new Set();
    for (const part of parts) {
        const t = String(part ?? "").toLowerCase().trim();
        if (!t) continue;
        if (/^(all|any|everything)$/.test(t)) CATEGORY_KEYS.forEach((k) => keys.add(k));
        else if (CATEGORY_KEYS.includes(t)) keys.add(t);
        else { const k = parseCategory(t); if (k) keys.add(k); }
    }
    return CATEGORY_KEYS.filter((k) => keys.has(k));
};
export const serializeInterests = (value) => parseInterests(value).join(",");
// labels for people: "Hardware, Software"
export const interestLabels = (stored) => parseInterests(stored).map((k) => (k === "combined" ? "Combined" : CATEGORIES[k])).join(", ");
// Does a team with these stored interests want a challenge of this category? No interests recorded
// (teams created before interests existed) means every category.
export const teamWantsCategory = (stored, category) => {
    const keys = parseInterests(stored);
    return keys.length === 0 || keys.includes(String(category || "").toLowerCase());
};
