import * as outline from './outline'

export function stringify(docs) {
    return docs.map(({title = '', list = []}) => {   
        let header = ({
            true: () => `# ${title.trim()}`,
            [title.trim() === '']: () => ''
        }).true()

        return `${header}\n\n${outline.stringify(list)}`.trim()
    }).join(`\n\n---\n\n`)
}

export function parse(content) {
    let lines = content.split('\n')
    let isSeparator = line => line.length >= 2 && [...line].every(x => x === '-')
    let separatorIndices = lines.reduce((acc, x, i) => isSeparator(x) ? [...acc, i] : acc, [0])
    
    return separatorIndices.map((index, j) => {
        let docLines = lines.slice(index, separatorIndices[j + 1] || lines.length)
        let headerIndex = docLines.findIndex(x => x.match(/^#\s+/) != null)
        let title = headerIndex < 0 ? '' : docLines[headerIndex].slice(1).trim()
        let listContent = docLines.slice(headerIndex + 1).join('\n').trim()

        return {title, list: outline.parse(listContent)}
    })
}

export function hash(docs) {
    return JSON.stringify(docs.map(({title, list}) => ({
        title, 
        hash: outline.hash(list)
    })))
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

export function append(docs, title, list = []) {
    return [...docs, {title, list}]
}
