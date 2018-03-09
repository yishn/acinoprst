export function get(key) {
    try {
        return JSON.parse(localStorage.getItem(`acinoprst_${key}`))
    } catch(_) {}

    return null
}

export function set(key, value) {
    try {
        localStorage.setItem(`acinoprst_${key}`, JSON.stringify(value))
        return true
    } catch(_) {}

    return false
}
