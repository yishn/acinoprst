export function get(key) {
    let value = localStorage.getItem(key)
    if (value == null) return null
    return JSON.parse(value)
}

export function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

export function remove(key) {
    localStorage.removeItem(key)
}
