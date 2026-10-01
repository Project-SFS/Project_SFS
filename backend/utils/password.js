// One password rule for every password a person chooses (SPOC sign-up, admin-created accounts,
// password changes): at least 8 characters with a letter, a number and a symbol.
export const PASSWORD_MAX = 128

export const passwordError = (password) => {
    const value = String(password ?? "")
    if (value.length < 8) return "The password must be at least 8 characters"
    if (value.length > PASSWORD_MAX) return `The password can be at most ${PASSWORD_MAX} characters`
    if (!/[A-Za-z]/.test(value)) return "The password must contain a letter"
    if (!/[0-9]/.test(value)) return "The password must contain a number"
    if (!/[^A-Za-z0-9]/.test(value)) return "The password must contain a symbol (e.g. ! @ # $)"
    return null
}
