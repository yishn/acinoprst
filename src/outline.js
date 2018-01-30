export function stringify(list, level = 0) {
    return list.map(item => {
        let indent = ' '.repeat(level * 4)
        let bullet = item.collapsed ? '+' : '-'
        let checkbox = item.checked ? '[x]' : '[ ]'
        let sublist = item.sublist.length > 0 ? '\n' + stringify(item.sublist, level + 1) : ''

        return `${indent}${bullet} ${checkbox} ${item.text}${sublist}`
    }).join('\n')
}

export function parse(content) {
    function parseList(items, start = 0) {
        if (start >= items.length) return []

        let {indent} = items[start]
        let list = []

        for (let i = start; i < items.length; i++) {
            if (items[i].indent < indent) return list
            if (items[i].indent > indent) continue

            let hasSublist = i + 1 < items.length && items[i + 1].indent > indent
            
            list.push({
                ...items[i],
                sublist: hasSublist ? parseList(items, i + 1) : []
            })
        }

        return list
    }

    let items = content.split('\n')
        .map(line => line.match(/^(\s*)([+-])\s*\[(\s*[xX]?\s*)\](.*)$/))
        .filter(match => match != null)
        .map(([, indent, bullet, x, text]) => ({
            indent: indent.length,
            collapsed: bullet === '+',
            checked: x.toLowerCase().includes('x'),
            text: text.trim()
        }))

    return parseList(items)
}
