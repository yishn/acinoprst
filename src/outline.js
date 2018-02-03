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
            if (items[i].indent < indent) break
            if (items[i].indent > indent) continue

            let hasSublist = i + 1 < items.length && items[i + 1].indent > indent

            let item = {...items[i]}
            delete item.indent
            item.sublist = hasSublist ? parseList(items, i + 1, item) : []

            list.push(item)
        }

        return list
    }

    let id = 0
    let items = content.split('\n')
        .map(line => line.match(/^(\s*)([+-])\s*\[(\s*[xX]?\s*)\](.*)$/))
        .filter(match => match != null)
        .map(([, indent, bullet, x, text]) => ({
            id: id++,
            indent: indent.length,
            collapsed: bullet === '+',
            checked: x.toLowerCase().includes('x'),
            text: text.trim()
        }))

    return parseList(items)
}

export function hash(list) {
    return JSON.stringify(list)
}

export function getItemTrail(list, id) {
    for (let item of list) {
        if (item.id === id) return [item]

        let trail = getItemTrail(item.sublist, id)
        if (trail.length > 0) return [...trail, item]
    }

    return []
}

export function getDescendantTrails(list, trail) {
    if (typeof trail === 'number') trail = getItemTrail(list, trail)
    if (trail.length === 0) return []

    let [item, ] = trail
    let subtrails = getLinearItemTrails(item.sublist)

    return subtrails.map(subtrail => [...subtrail, ...trail])
}

export function getLinearItemTrails(list, options = {}) {
    let {includeCollapsed = true} = options
    let result = []

    for (let item of list) {
        result.push([item])

        if (includeCollapsed || !item.collapsed) {
            let linearItemTrails = getLinearItemTrails(item.sublist, options)
            result.push(...linearItemTrails.map(trail => [...trail, item]))
        }
    }

    return result
}

export function update(list, trail, data) {
    if (typeof trail === 'number') trail = getItemTrail(list, trail)
    if (trail.length === 0) return list
    if (trail.length === 1) return list.map(item => item.id === trail[0].id ? {...item, ...data} : item)

    let [item, ...parentTrail] = trail

    return update(list, parentTrail, {
        sublist: update(parentTrail[0].sublist, [item], data)
    })
}

export function remove(list, trail) {
    if (typeof trail === 'number') trail = getItemTrail(list, trail)
    if (trail.length === 0) return list
    if (trail.length === 1) return list.filter(item => item.id !== trail[0].id)

    let [item, ...parentTrail] = trail

    return update(list, parentTrail, {
        sublist: remove(parentTrail[0].sublist, [item])
    })
}

export function move(list, trail1, op, trail2) {
    if (typeof trail1 === 'number') trail1 = getItemTrail(list, trail1)
    if (typeof trail2 === 'number') trail2 = getItemTrail(list, trail2)
    if (trail1.length === 0 || trail2.length === 0 || trail1[0] === trail2[0]) return list

    let [item1, ] = trail1
    let [item2, ...parentTrail2] = trail2
    let newList = remove(list, trail1)

    if (op === 'in') {
        return update(newList, trail2, {
            sublist: [...item2.sublist, item1]
        })
    } else if (op === 'after' || op === 'before') {
        let shift = op === 'after' ? 1 : 0
        let item2Index = newList.indexOf(item2)

        if (item2Index >= 0) {
            newList.splice(item2Index + shift, 0, item1)
            return newList
        } else {
            let newSublist = [...parentTrail2[0].sublist]
            newSublist.splice(newSublist.indexOf(item2) + shift, 0, item1)

            return update(newList, parentTrail2, {
                sublist: newSublist
            })
        }
    }

    return list
}

export function append(list, data) {
    function getMaxId(list) {
        return Math.max(...list.map(item =>
            Math.max(item.id, getMaxId(item.sublist))
        ))
    }

    return [...list, {
        collapsed: false,
        checked: false,
        text: '',
        ...data,
        id: getMaxId(list) + 1,
        sublist: []
    }]
}

export function insert(list, data, op, trail2) {
    let trail1 = append(list, data).slice(-1)
    return insert(list, trail1, op, trail2)
}
