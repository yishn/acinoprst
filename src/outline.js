export function stringify(list, level = 0) {
    return list.map(item => {
        let indent = ' '.repeat(level * 4)
        let bullet = item.collapsed && item.sublist.length > 0 ? '+' : '-'
        let checkbox = item.checked ? '[x]' : '[ ]'
        let sublist = item.sublist.length > 0 ? '\n' + stringify(item.sublist, level + 1) : ''

        return `${indent}${bullet} ${checkbox} ${item.text}${sublist}`
    }).join('\n')
}

export function parse(content, {ids = null} = {}) {
    function parseList(items, start = 0) {
        if (start >= items.length) return []

        let {indent} = items[start]
        let parentIndent = start === 0 ? -1 : items[start - 1].indent
        let list = []

        for (let i = start; i < items.length; i++) {
            if (items[i].indent <= parentIndent) break
            if (items[i].indent > indent) continue

            indent = items[i].indent
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
        .map(line => line.replace(/\r/g, '').match(/^(\s*)([+*-])\s*(\[\s*[xX]?\s*\])?\s?(.*)$/))
        .filter(match => match != null)
        .map(([, indent, bullet, x, text], i) => ({
            id: ids != null ? ids[i] : ++id,
            indent: indent.length,
            collapsed: bullet === '+',
            checked: x != null && x.toLowerCase().includes('x'),
            text
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

export function getStats(list) {
    let linearItemTrails = getLinearItemTrails(list)

    let result = {
        count: linearItemTrails.length,
        checked: linearItemTrails.filter(([item]) => item.checked).length
    }

    result.progress = result.count === 0 ? 0 : result.checked / result.count

    return result
}

export function getMaxId(list) {
    return Math.max(0, ...list.map(item =>
        Math.max(item.id, getMaxId(item.sublist))
    ))
}

export function getIdsBetween(list, ids) {
    let linearItemTrails = getLinearItemTrails(list)
    let indices = ids.map(id => linearItemTrails.findIndex(([item]) => item.id === id))
    let [min, max] = indices
        .filter(x => x >= 0)
        .reduce(([min, max], i) => [Math.min(i, min), Math.max(i, max)], [Infinity, -Infinity])

    return linearItemTrails.slice(min, max + 1).map(([item]) => item.id)
}

export function separateItems(list) {
    return list.map((item, i) => [i, item]).sort(([i, item1], [j, item2]) =>
        +item1.checked - +item2.checked || i - j
    ).map(([, item]) => ({
        ...item,
        sublist: separateItems(item.sublist)
    }))
}

export function removeCheckedTasks(list) {
    return list.reduce((acc, item) => (
        item.checked ? acc
        : (acc.push({
            ...item,
            sublist: removeCheckedTasks(item.sublist)
        }), acc)
    ), [])
}

export function expandAll(list) {
    return list.map(item => ({
        ...item,
        collapsed: false,
        sublist: expandAll(item.sublist)
    }))
}

export function collapseLevel(list, level) {
    return list.map(item => ({
        ...item,
        collapsed: level > 0 ? false : level < 0 ? item.collapsed : true,
        sublist: level === 0 ? item.sublist : collapseLevel(item.sublist, level - 1)
    }))
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

export function move(list, trail1, op, id2) {
    if (typeof trail1 === 'number') trail1 = getItemTrail(list, trail1)
    if (trail1.length === 0) return list

    let newList = remove(list, trail1)
    if (newList === list) return list

    let trail2 = getItemTrail(newList, id2)
    if (trail2.length === 0 || trail1[0].id === trail2[0].id) return list

    let [item1, ] = trail1
    let [item2, ...parentTrail2] = trail2

    if (op === 'in') {
        newList = update(newList, trail2, {
            sublist: [...item2.sublist, item1]
        })
    } else if (op === 'after' || op === 'before') {
        let shift = op === 'after' ? 1 : 0
        let item2Index = newList.indexOf(item2)

        if (item2Index >= 0) {
            newList.splice(item2Index + shift, 0, item1)
        } else {
            let newSublist = [...parentTrail2[0].sublist]
            newSublist.splice(newSublist.indexOf(item2) + shift, 0, item1)

            newList = update(newList, parentTrail2, {
                sublist: newSublist
            })
        }
    } else {
        return list
    }

    return reveal(newList, item1.id)
}

export function reveal(list, trail) {
    if (typeof trail === 'number') trail = getItemTrail(list, trail)

    let [, ...parentTrail] = trail
    if (parentTrail.length === 0) return list

    return reveal(update(list, parentTrail[0].id, {collapsed: false}), parentTrail[0].id)
}

export function append(list, data) {
    return [...list, {
        collapsed: false,
        checked: false,
        text: '',
        ...data,
        id: getMaxId(list) + 1,
        sublist: []
    }]
}
