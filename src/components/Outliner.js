import {h, Component} from 'preact'
import * as str from '../str'
import CodeTextarea from './CodeTextarea'

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
        let {value, selectionStart, selectionEnd} = evt.currentTarget
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

            let lineStart = str.reverseIndexOf(value, '\n', selectionStart - 1) + 1
            let lineEnd = str.truncatedIndexOf(value, '\n', lineStart)
            let line = value.slice(lineStart, lineEnd)
            let lineSelection = selectionStart - lineStart
            let checkboxMatch = line.match(/^(\s*)- \[\s*([Xx])?\s*\]/)
            let reformat = checkboxMatch != null
                && ((lineSelection < checkboxMatch[0].length
                && lineSelection >= checkboxMatch[1].length + 3
                && (evt.keyCode === 8 && line[lineSelection - 1].toLowerCase() === 'x' // Backspace
                || evt.keyCode === 46 && line[lineSelection].toLowerCase() === 'x' // Delete
                || evt.keyCode === 88)) // x
                || evt.keyCode == 88 && evt.ctrlKey)

            if (!reformat) return
            evt.preventDefault()

            let indent = checkboxMatch[1]
            let done = !evt.ctrlKey ? evt.keyCode === 88 : checkboxMatch[2] == null
            let checkbox = `- [${done ? 'x' : ' '}]`
            let diff = checkboxMatch[0].length - indent.length - checkbox.length
            let newSelectionStart = !evt.ctrlKey
                ? lineStart + indent.length + 4
                : selectionStart - diff
            let newSelectionEnd = !evt.ctrlKey ? newSelectionStart : selectionEnd - diff
            let newLine = indent + checkbox + line.slice(checkboxMatch[0].length)
            let newValue = [value.slice(0, lineStart), value.slice(lineEnd)].join(newLine)

            onChange({
                value: newValue,
                selectionStart: newSelectionStart,
                selectionEnd: newSelectionEnd
            })
        }
    }

    render() {
        return <section id="outliner">
            <CodeTextarea
                value={this.props.value}
                onChange={this.props.onChange}
                onUndo={this.props.onUndo}
                onRedo={this.props.onRedo}
                onSelectionChange={this.props.onSelectionChange}
                onKeyDown={this.handleKeyDown}
            />
        </section>
    }
}
