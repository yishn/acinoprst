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
    function parseList(items, start = 0, parent = null) {
        if (start >= items.length) return []

        let {indent} = items[start]
        let list = []

        for (let i = start; i < items.length; i++) {
            if (items[i].indent < indent) break
            if (items[i].indent > indent) continue

            let hasSublist = i + 1 < items.length && items[i + 1].indent > indent
            let item = {...items[i], parent}

            delete item.indent
            item.sublist = hasSublist ? parseList(items, i + 1, item) : []
            list.push(item)
        }

        return list
    }

    let id = 0
    let items = content.split('\n')
        .map(line => line.match(/^(\s*)([+-])\s*\[(\s*[xX]?\s*)\](.*)$/))
        .filter((match) => match != null)
        .map(([, indent, bullet, x, text]) => ({
            id: id++,
            indent: indent.length,
            collapsed: bullet === '+',
            checked: x.toLowerCase().includes('x'),
            text: text.trim()
        }))

    return parseList(items)
}

function getItem(list, id) {
    for (let item of list) {
        if (item.id === id) return item

        let result = getItem(item.sublist, id)
        if (result != null) return result
    }

    return null
}

function getNewId(list) {
    function getMaxId(list) {
        return Math.max(...list.map(item =>
            Math.max(item.id, getMaxId(item.sublist))
        ))
    }

    return getMaxId(list) + 1
}

export function update(list, id, data) {
    if (list.some(item => item.id === id))
        return list.map(item => item.id === id ? {...item, ...data} : item)

    let item = getItem(list, id)
    if (item == null) return list

    return update(list, item.parent.id, {
        sublist: update(item.parent.sublist, id, data)
    })
}

export function remove(list, id) {
    if (list.some(item => item.id === id))
        return list.filter(item => item.id !== id)

    let item = getItem(list, id)
    if (item == null) return list

    return update(list, item.parent.id, {
        sublist: remove(item.parent.sublist, id)
    })
}

export function insert(list, id1, op, id2) {
    if (id1 === id2) return list

    let item1 = ({
        'true': () => ({
            id: getNewId(list),
            collapsed: false,
            checked: false,
            text: '',
            ...id1
        }),
        [typeof id1 === 'number']: () => getItem(list, id1)
    }).true()

    let item2 = getItem(list, id2)
    if (item2 == null) return list

    let newList = remove(list, item1.id)

    if (op === 'in') {
        return update(newList, id2, {
            sublist: [...item2.sublist, item1]
        })
    } else if (op === 'after' || op === 'before') {
        let shift = op === 'after' ? 1 : 0

        if (item2.parent == null) {
            newList.splice(newList.indexOf(item2) + shift, 0, item1)
            return newList
        } else {
            let newSublist = item2.parent.sublist.slice()
            newSublist.splice(newSublist.indexOf(item2) + shift, 0, item1)

            return update(newList, item2.parent.id, {
                sublist: newSublist
            })
        }
    }

    return list
}
