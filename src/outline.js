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
    let task = line.trim().slice(0, 3) === '- ['
    let type = task ? 'task' : 'comment'
    let done = task && line.trim().slice(2, 5) === '[x]'
    let match = line.match(/^(\s*)-/)

    if (match == null) return null

    let indent = match[1].length
    let content = line.slice(indent + (task ? 5 : 1)).trim()

    return [i, type, {indent, done, content}]
}

export function getLines(content) {
    return content
        .replace(/\r/g, '')
        .replace(/\t/g, '    ')
        .split('\n')
        .map(parseLine)
        .filter(x => x != null)
}

export function parseLines(lines, start = 0, length = Infinity) {
    if (length <= 0) return []

    let [, , {indent}] = lines[start]

    return lines.filter((x, i) =>
        i >= start && i < start + length && x[2].indent === indent
    ).map(([i, type, x]) => {
        let sublistStart = i + 1
        let sublist = getSuccessiveLines(lines, sublistStart, y => y[2].indent > x.indent)

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
