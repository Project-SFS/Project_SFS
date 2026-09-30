import AsyncHandler from "../utils/AsyncHandler.js";
import { sessionUser } from "../middleware/auth.js";

const Get_cookies = AsyncHandler(async (req, res) => {
    const user = await sessionUser(req);
    if (!user) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.json(user);
});

export { Get_cookies };
