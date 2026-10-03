import { runGraduation } from "./graduation.js"

// Background jobs: run once at startup and then every 6 hours
//   - graduation: archive teams whose members have all graduated
// (challenges have no deadlines any more, so there are no deadline reminders)
const JOBS = [["Graduation check", runGraduation]]
const EVERY_MS = 6 * 60 * 60 * 1000

let running = false
const runAll = async () => {
    if (running) return
    running = true
    for (const [name, job] of JOBS) {
        try {
            await job()
        } catch (err) {
            console.error(`${name} failed:`, err.message)
        }
    }
    running = false
}

export const startScheduledJobs = () => {
    runAll()
    setInterval(runAll, EVERY_MS).unref()
}
