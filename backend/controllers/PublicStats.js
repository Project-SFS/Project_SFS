import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { layout, escapeHtml, deliver, background } from "../utils/notifications.js";

// Live numbers for the home page hero. Public, so only totals - never names or emails.
//  - students: members of teams that have not graduated
//  - problems: every published challenge
//  - colleges: distinct colleges with an approved (ACTIVE) SPOC
const Get_public_stats = AsyncHandler(async (req, res) => {
    const [[row]] = await connection.query(`
        SELECT
            (SELECT COUNT(*) FROM SolveForSakthi_Team_Members_List m
                JOIN SolveForSakthi_Team_List t ON t.ID = m.TEAM_ID
                WHERE t.GRADUATED_AT IS NULL) AS students,
            (SELECT COUNT(*) FROM SolveForSakthi_Problems) AS problems,
            (SELECT COUNT(DISTINCT UPPER(LTRIM(RTRIM(COLLEGE)))) FROM SolveForSakthi_Users
                WHERE ROLE = 'SPOC' AND STATUS IN ('ACTIVE', 'APPROVED') AND COLLEGE IS NOT NULL AND LTRIM(RTRIM(COLLEGE)) <> '') AS colleges
    `);
    res.set("Cache-Control", "public, max-age=60");
    res.json({
        students: Number(row?.students) || 0,
        problems: Number(row?.problems) || 0,
        colleges: Number(row?.colleges) || 0,
    });
});

export { Get_public_stats };

// "Submit your Interest" form on the public site. Nothing is stored in its own table: the message goes to
// the Sakthi Auto inbox (INTEREST_EMAIL, default hr@sakthiauto.com) and a confirmation goes to the sender.
// Both are kept in the mail log like every other email. Separate emails, never cc.
const INTEREST_TYPES = ["Student", "Faculty / SPOC", "College / Institution", "Industry partner", "Other"];
const INTEREST_LIMIT = 5; // per IP per hour
const interestHits = new Map();

const clean = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const Submit_interest = AsyncHandler(async (req, res) => {
    // only accepted submissions count, so fixing a typo in the form does not use up the limit
    const now = Date.now();
    let hit = interestHits.get(req.ip);
    if (!hit || now - hit.since >= 60 * 60 * 1000) hit = { count: 0, since: now };
    if (hit.count >= INTEREST_LIMIT) {
        return res.status(429).json({ message: "Too many submissions from this network. Please try again in an hour." });
    }

    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 200).toLowerCase();
    const phone = clean(req.body?.phone, 20);
    const organisation = clean(req.body?.organisation, 200);
    const type = INTEREST_TYPES.includes(req.body?.type) ? req.body.type : "Other";
    const message = String(req.body?.message ?? "").trim().slice(0, 2000);

    if (name.length < 2) return res.status(400).json({ message: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
    if (phone && !/^[+\d][\d\s-]{6,19}$/.test(phone)) return res.status(400).json({ message: "Please enter a valid phone number, or leave it empty." });
    if (!organisation) return res.status(400).json({ message: "Please enter your college or organisation." });
    if (message.length < 10) return res.status(400).json({ message: "Please tell us a little about your interest (at least 10 characters)." });

    hit.count += 1;
    interestHits.set(req.ip, hit);
    // forget old entries so the map cannot grow without limit
    if (interestHits.size > 5000) for (const [ip, h] of interestHits) if (now - h.since >= 60 * 60 * 1000) interestHits.delete(ip);

    const inbox = (process.env.INTEREST_EMAIL || "hr@sakthiauto.com").trim();
    const rows = [["Name", name], ["Email", email], ["Phone", phone || "—"], ["I am", type], ["College / organisation", organisation]];
    const messageHtml = escapeHtml(message).replace(/\n/g, "<br>");

    background("interest", async () => {
        deliver("interest (inbox)", {
            to: inbox,
            replyTo: email,
            subject: `New interest: ${name} (${organisation})`,
            html: layout({
                heading: "New \"Submit your Interest\" request",
                intro: "Someone submitted the interest form on the Solve For Sakthi website. Reply to this email to answer them directly.",
                rows,
                outro: `<strong>Message</strong><br>${messageHtml}`,
            }),
        });
        deliver("interest (confirmation)", {
            to: email,
            subject: "We received your interest in Solve For Sakthi",
            html: layout({
                heading: "Thank you for your interest",
                intro: `Hello ${escapeHtml(name)}, thank you for your interest in Solve For Sakthi. Our team will get back to you soon.`,
                rows,
                outro: `<strong>Your message</strong><br>${messageHtml}`,
                linkPath: "/problemstatements", linkLabel: "Explore challenges",
            }),
        });
    });

    res.json({ message: "Thank you! Your interest has been submitted. We will get back to you soon." });
});

export { Submit_interest, INTEREST_TYPES };
