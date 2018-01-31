import * as outline from './outline'

export function create(title, list = []) {
    return {title, list}
}

export function stringify({title, list}) {
    let header = ({
        true: `# ${title.trim()}`,
        [title.trim() === '']: ''
    }).true()

    return `${header}\n\n${outline.stringify(list)}`.trim()
}

export function parse(content) {
    let lines = content.split('\n')
    let headerIndex = lines.findIndex(x => x.match(/^#\s+/) != null)
    let title = headerIndex < 0 ? '' : lines[headerIndex].slice(1).trim()
    let listContent = lines.slice(headerIndex + 1).join('\n')

    return create(title, outline.parse(listContent))
}
