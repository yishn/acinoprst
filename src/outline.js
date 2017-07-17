function indent(content, spaces) {
    let prefix = ' '.repeat(spaces)
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
    let checkboxMatch = trimmedLine.match(/^- \[\s*([Xx])?\s*\]/)
    let task = checkboxMatch != null

    let type = task ? 'task' : 'text'
    let done = task && checkboxMatch[1] != null

    let indent = line.match(/^\s*/)[0].length
    let content = trimmedLine[0] === '-'
        ? trimmedLine.slice(task ? trimmedLine.indexOf(']') + 1 : 1).trim()
        : trimmedLine

    if (trimmedLine.length === 0 || trimmedLine[0] === '#') {
        return [i, null, {content: trimmedLine}]
    }

    return [i, type, {indent, done, content}]
}

function normalizeBreaks(content) {
    return content
        .replace(/\r/g, '')
        .replace(/\t/g, '    ')
}

function getLines(content) {
    return normalizeBreaks(content)
        .split('\n')
        .map(parseLine)
}

function parseLines(lines, start = 0, length = Infinity) {
    if (length <= 0 || lines.length === 0) return []

    let [, , {indent}] = lines[start]

    return lines.map(([i, type, x], j) => {
        if (j < start || j >= start + length || x.indent > indent)
            return null

        let sublistStart = j + 1
        let sublist = getSuccessiveLines(lines, sublistStart, y => y[2].indent > indent)

        return {
            line: i,
            type,
            done: x.done,
            content: x.content,
            sublist: parseLines(lines, sublistStart, sublist.length)
        }
    }).filter(x => x != null)
}

export function parse(content) {
    return parseLines(getLines(content).filter(([, type]) => type != null))
}

export function stringify(list) {
    return list.map(task => {
        let checkbox = task.type === 'task' ? `[${task.done ? 'x' : ' '}] ` : ''

        return [
            `- ${checkbox}${task.content}`,
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

export function extractStats(content) {
    let [tasks, done, items] = getLines(content).reduce(([t, d, i], [, type, x]) => {
        return type !== 'task'
            ? [t, d, +(type != null) + i]
            : [t + 1, +x.done + d, i + 1]
    }, [0, 0, 0])

    return {
        tasks, done, items,
        progress: tasks === 0 ? 0 : done / tasks
    }
}

export function separate(content) {
    let sort = list => list.map((x, i) => [i, x])
        .sort(([i, x1], [j, x2]) => +x1.done - +x2.done || i - j)
        .map(([, x]) => (x.sublist = sort(x.sublist), x))

    return stringify(sort(parse(content)))
}

export function removeDoneTasks(content) {
    let remove = list => list.filter(x => x.type !== 'task' || !x.done)
        .map(x => (x.sublist = remove(x.sublist), x))

    return stringify(remove(parse(content)))
}

export function parseFiles(content) {
    if (content.trim() === '') return []

    let lines = normalizeBreaks(content).split('\n')
    let breakIndices = lines.map((x, i) =>
        x.trim().length >= 3 && [...x.trim()].every(y => y === '-') ? i : null
    ).filter(x => x != null)

    breakIndices.unshift(-1)

    return breakIndices
    .reduce((acc, x, i, a) => [...acc, lines.slice(x + 1, a[i + 1] || lines.length)], [])
    .map(x => x.join('\n'))
    .map(x => ({
        title: extractComments(x)[0] || '',
        content: reformat(x)
    }))
}

export function stringifyFiles(files) {
    return files.map(({title, content}) => [`# ${title}`, reformat(content)].join('\n\n'))
        .join('\n---\n\n')
}
