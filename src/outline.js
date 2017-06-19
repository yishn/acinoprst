function indent(content, spaces) {
    let prefix = Array(spaces).fill(' ').join('')
    return content.split('\n').map(l => prefix + l).join('\n')
}

function getSuccessiveLines(lines, index, predicate) {
    let result = []

    for (let i = index; i < lines.length; i++) {
        if (!predicate(lines[i])) break
        result.push(lines[i])
    }

    return result
}

function parseLine(line, i) {
    let trimmedLine = line.trim()
    let task = /^- \[[Xx ]\]/.test(trimmedLine)

    let type = task ? 'task' : 'text'
    let done = task && trimmedLine.slice(2, 5).toLowerCase() === '[x]'

    let match = line.match(/^\s*/)
    let indent = match[0].length
    let content = trimmedLine[0] === '-' ? trimmedLine.slice(task ? 5 : 1).trim() : trimmedLine

    if (trimmedLine.length === 0 || trimmedLine[0] === '#') {
        return [i, null, {content: trimmedLine}]
    }

    return [i, type, {indent, done, content}]
}

export function getLines(content) {
    return content
        .replace(/\r/g, '')
        .replace(/\t/g, '    ')
        .split('\n')
        .map(parseLine)
}

export function parseLines(lines, start = 0, length = Infinity) {
    if (length <= 0) return []

    while (lines[start][1] == null && start < Math.min(start + length, lines.length)) {
        start++
        length--
    }

    if (length <= 0) return []
    let [, , {indent}] = lines[start]

    return lines.filter((x, i) =>
        x != null && i >= start && i < start + length && x[2].indent <= indent
    ).map(([i, type, x]) => {
        let sublistStart = i + 1
        let sublist = getSuccessiveLines(lines, sublistStart, y => y[2].indent > indent)

        return {
            line: i,
            type,
            done: x.done,
            content: x.content,
            sublist: parseLines(lines, sublistStart, sublist.length)
        }
    })
}

export function parse(content) {
    return parseLines(getLines(content))
}

export function stringify(list) {
    return list.map(task => {
        let done = task.type === 'task' ? `[${task.done ? 'x' : ' '}] ` : ''

        return [
            `- ${done}${task.content}`,
            indent(stringify(task.sublist), 4)
        ].filter(x => x.trim() !== '').join('\n').trim()
    }).join('\n') + '\n'
}

export function reformat(content) {
    return stringify(parse(content))
}

export function extractComments(content) {
    return getLines(content)
        .filter(([, type, x]) => type == null && x.content[0] === '#')
        .map(([, , x]) => x.content.slice(1).trim())
}
