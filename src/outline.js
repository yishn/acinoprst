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

export function getLines(content) {
    let lines = content.replace(/\r/g, '').split('\n')

    return lines.map((x, i) => {
        let task = x.trim()[0] === '-'

        if (!task) return [i, 'comment', {content: x.trim()}]
        else return [i, 'task', parseTask(x)]

        return [i, 'invalid']
    })
}

export function parseLines(lines, start = 0, length = Infinity) {
    if (length <= 0) return []

    let firstTaskIndex = start + getSuccessiveLines(lines, start, x => x[1] === 'comment').length
    let [, , {indent}] = lines[firstTaskIndex]

    return lines.filter((x, i) => i < start + length && x[1] === 'task' && x[2].indent === indent)
    .map(([i, type, x]) => {
        let comments = getSuccessiveLines(lines, i + 1, y => y[1] === 'comment')
        let sublistStart = i + 1 + comments.length
        let sublist = getSuccessiveLines(lines, sublistStart, y => y[1] === 'comment'
            || y[1] === 'task'
            && y[2].indent !== indent
            && y[2].indent === lines[sublistStart][2].indent)

        return {
            line: i,
            done: x.done,
            content: x.content,
            comment: comments.map(y => y[2].content).join('\n'),
            sublist: parseLines(lines, sublistStart, sublist.length)
        }
    })
}

export function parse(content) {
    return parseLines(getLines(content))
}

export function stringify(list) {
    return list.map(task => {
        return [
            `- [${task.done ? 'x' : ' '}] ${task.content}`,
            indent(task.comment, 6),
            indent(stringify(task.sublist), 4)
        ].filter(x => x.trim() !== '').join('\n').trim()
    }).join('\n') + '\n'
}

export function reformat(content) {
    return stringify(parse(content))
}
