export function reverseIndexOf(haystack, predicate, index) {
    if (!(predicate instanceof Function)) {
        let needle = predicate
        predicate = x => x === needle
    }

    for (let i = index; i >= 0; i--) {
        if (predicate(haystack[i])) return i
    }

    return -1
}

export function truncatedIndexOf(haystack, predicate, start) {
    if (!(predicate instanceof Function)) {
        let needle = predicate
        predicate = x => x === needle
    }

    for (let i = start; i < haystack.length; i++) {
        if (predicate(haystack[i])) return i
    }

    return haystack.length
}

export function rangedIndexOf(haystack, predicate, start, end) {
    if (!(predicate instanceof Function)) {
        let needle = predicate
        predicate = x => x === needle
    }

    let indices = []

    for (let i = Math.max(start, 0); i < Math.min(haystack.length, end); i++) {
        if (predicate(haystack[i])) indices.push(i)
    }

    return indices
}

export function getIndent(haystack, index) {
    let indent = 0

    for (let i = index; i < haystack.length; i++) {
        if (haystack[i] === ' ') indent++
        else break
    }

    return indent
}
