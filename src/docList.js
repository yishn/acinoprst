import {create as createDoc, parse as parseDoc, stringify as stringifyDoc} from './doc'

export function stringify(docs) {
    return docs.map(stringifyDoc).join(`\n---\n`)
}

export function parse(content) {
    let lines = content.split('\n')
    let isSeparator = line => [...line].every(x => x === '-')
    let separatorIndices = lines.reduce((acc, x, i) => isSeparator(x) ? [...acc, i] : acc, [0])
    
    return separatorIndices.map((index, j) => parseDoc(
        lines.slice(index, separatorIndices[j + 1] || lines.length).join('\n')
    ))
}

export function update(docs, index, doc) {
    let newDocs = [...docs]
    newDocs[index] = doc

    return newDocs
}

export function remove(docs, index) {
    let newDocs = [...docs]
    newDocs.splice(index, 1)

    return newDocs
}

export function move(docs, index1, index2) {
    let newDocs = [...docs]
    let [doc] = newDocs.splice(index1, 1)
    newDocs.splice(index2, 0, doc)

    return newDocs
}

export function append(docs, {title, sublist = []}) {
    return [...docs, createDoc(title, sublist)]
}
