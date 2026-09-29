import { AsyncLocalStorage } from "async_hooks"

// Remembers, for the duration of a request (and the async work it starts, like sending mails),
// the address the person used to reach the platform, e.g. http://203.0.113.10:9021.
const storage = new AsyncLocalStorage()

const requestContext = (req, res, next) => {
    // Host comes from nginx with the port the browser used; X-Forwarded-* from an outer proxy if any
    const host = req.get("x-forwarded-host") || req.get("host")
    storage.run({ origin: host ? `${req.protocol}://${host}` : null }, next)
}

const currentOrigin = () => storage.getStore()?.origin || null

export { requestContext, currentOrigin }
