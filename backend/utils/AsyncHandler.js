const AsyncHandler = requestedfunction => async (req, res, next) => {
    try {
        return await requestedfunction(req, res, next);
    } catch (error) {
        console.error(`${req.method} ${req.originalUrl} failed:`, error && error.message ? error.message : error);
        if (res.headersSent) return;
        // database/driver messages reveal schema details, so only show them outside production
        const message = process.env.NODE_ENV !== "production" && error && error.message ? error.message : "Internal Server Error";
        return res.status(500).json({ error: message });
    }
};

export default AsyncHandler;