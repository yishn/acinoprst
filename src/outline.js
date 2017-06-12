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

function parseTask(line) {
    let match = line.match(/^(\s*)-/)
    if (match == null) return null

    let indent = match[1].length
    let done = line[indent + 3].toLowerCase() === 'x'
    let content = line.slice(indent + 5).trim()

    return {indent, done, content}
}

function parseComment(line) {
    let match = line.match(/^(\s*)-/)
    if (match == null) return null

    let indent = match[1].length
    let done = false
    let content = line.slice(indent + 1).trim()

    return {indent, done, content}
}

export function getLines(content) {
    let lines = content
        .replace(/\r/g, '')
        .replace(/\t/g, '    ')
        .split('\n')

    return lines.map((x, i) => {
        let task = x.trim().slice(0, 3) === '- ['

        if (!task) return [i, 'comment', parseComment(x)]
        else return [i, 'task', parseTask(x)]

        return [i, 'invalid']
    })
}

export function parseLines(lines, start = 0, length = Infinity) {
    if (length <= 0) return []

    let [, , {indent}] = lines[start]

    return lines.filter((x, i) => i < start + length && x[2].indent === indent)
    .map(([i, type, x]) => {
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
