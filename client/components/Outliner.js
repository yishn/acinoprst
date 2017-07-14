import {h, Component} from 'preact'
import CodeTextarea from './CodeTextarea'

function reverseIndexOf(haystack, needle, index) {
    for (let i = index; i >= 0; i--) {
        if (haystack[i] === needle) return i
    }

    return -1
}

export default class Outliner extends Component {
    constructor() {
        super()
    }

    shouldComponentUpdate(nextProps) {
        return this.props.value !== nextProps.value
            || this.props.onChange !== nextProps.onChange
            || this.props.onSelectionChange !== nextProps.onSelectionChange
    }

    handleKeyDown = evt => {
        let {value, selectionStart} = evt.currentTarget
        let {onChange = () => {}} = this.props

        if (evt.keyCode === 13) {
            // Insert list bullets when pressing enter

            let prefix = !evt.shiftKey ? '- ' : '- [ ] '
            let chunks = [value.slice(0, selectionStart), value.slice(selectionStart)]
            let matchSpaces = chunks[1].match(/^([^\S\n]*)- (\[\s*[Xx]?\s*\])?/)
            let newSelection = selectionStart + prefix.length

            if (matchSpaces) {
                // We already have bullets

                prefix = ''
                chunks[1] = chunks[1].slice(matchSpaces[1].length)
                newSelection = selectionStart + 2 + (matchSpaces[2] || '').length
            }

            let newValue = chunks.join(prefix)

            onChange({
                value: newValue,
                selectionStart: newSelection,
                selectionEnd: newSelection
            })
        } else if ([88, 8, 46].includes(evt.keyCode)) {
            // Reformat line when pressing x or removing x

            let lineStart = reverseIndexOf(value, '\n', selectionStart) + 1
            let lineEnd = (value.slice(lineStart) + '\n').indexOf('\n') + lineStart
            let line = value.slice(lineStart, lineEnd)
            let lineSelection = selectionStart - lineStart
            let checkboxMatch = line.match(/^(\s*)- \[\s*([Xx])?\s*\]/)
            let reformat = checkboxMatch != null
                && lineSelection < checkboxMatch[0].length
                && lineSelection >= checkboxMatch[1].length + 3
                && (evt.keyCode === 8 && line[lineSelection - 1].toLowerCase() === 'x' // Backspace
                || evt.keyCode === 46 && line[lineSelection].toLowerCase() === 'x' // Delete
                || evt.keyCode === 88) // x

            if (!reformat) return
            evt.preventDefault()

            let indent = checkboxMatch[1]
            let done = checkboxMatch[2] != null
            let checkbox = `- [${evt.keyCode === 88 ? 'x' : ' '}]`
            let newSelection = lineStart + indent.length + 4
            let newLine = indent + checkbox + line.slice(checkboxMatch[0].length)
            let newValue = [value.slice(0, lineStart), value.slice(lineEnd)].join(newLine)

            onChange({
                value: newValue,
                selectionStart: newSelection,
                selectionEnd: newSelection
            })
        }
    }

    render() {
        return <section id="outliner">
            <CodeTextarea
                value={this.props.value}
                onChange={this.props.onChange}
                onSelectionChange={this.props.onSelectionChange}
                onKeyDown={this.handleKeyDown}
            />
        </section>
    }
}
