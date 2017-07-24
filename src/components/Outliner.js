import {h, Component} from 'preact'
import * as str from '../str'
import CodeTextarea from './CodeTextarea'

function toggleDone(lines, indexStart, indexEnd, forceDone = null) {
    let result = [...lines]

    for (let index = indexStart; index <= indexEnd; index++) {
        let line = lines[index]
        let checkboxMatch = line.match(/^(\s*)- \[\s*([Xx])?\s*\]/)

        if (checkboxMatch == null) continue

        let done = forceDone != null ? forceDone : checkboxMatch[2] == null
        let indent = checkboxMatch[1]
        let checkbox = `- [${done ? 'x' : ' '}]`
        let newLine = indent + checkbox + line.slice(checkboxMatch[0].length)

        result[index] = newLine
    }

    return result
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
        } else if (evt.keyCode === 88 && evt.ctrlKey && evt.shiftKey) {
            // Toggle task done status with Ctrl+Shift+X

            evt.preventDefault()

            let lines = value.split('\n')
            let [rowStart, colStart] = str.getPositionFromIndex(value, selectionStart)
            let [rowEnd, colEnd] = str.getPositionFromIndex(value, selectionEnd)
            let newLines = toggleDone(lines, rowStart, rowEnd)
            let newValue = newLines.join('\n')
            let selection = [selectionStart, selectionEnd]
            let [newSelectionStart, newSelectionEnd] = selection
            let lineStart = str.reverseIndexOf(value, '\n', selectionStart - 1) + 1

            if (rowStart === rowEnd) {
                let checkboxMatch = lines[rowStart].match(/^(\s*- \[)\s*[Xx]?\s*\]/)
                let diff = newLines[rowStart].length - lines[rowStart].length

                ;[newSelectionStart, newSelectionEnd] = [colStart, colEnd].map((col, i) =>
                    checkboxMatch == null ? selection[i]
                    : col >= checkboxMatch[0].length ? selection[i] + diff
                    : col >= checkboxMatch[1].length ? lineStart + checkboxMatch[1].length + 1
                    : selection[i]
                )
            } else {
                newSelectionStart = lineStart
                newSelectionEnd = newLines.slice(0, rowEnd + 1).join('\n').length
            }

            onChange({
                value: newValue,
                selectionStart: newSelectionStart,
                selectionEnd: newSelectionEnd
            })
        } else if ([88, 8, 46].includes(evt.keyCode)) {
            // Reformat line when pressing x or removing x

            if (evt.keyCode !== 88 && Math.abs(selectionStart - selectionEnd) > 1) return
            if (evt.keyCode === 8 && value[selectionEnd - 1].toLowerCase() !== 'x') return // Backspace
            if (evt.keyCode === 46 && value[selectionStart].toLowerCase() !== 'x') return // Delete

            let lines = value.split('\n')
            let [index, colStart] = str.getPositionFromIndex(value, selectionStart)
            let [, colEnd] = str.getPositionFromIndex(value, selectionEnd)
            let line = lines[index]

            let checkboxMatch = line.match(/^(\s*)- \[\s*([Xx])?\s*\]/)
            if (checkboxMatch == null) return

            let [criticalStart, criticalEnd] = [checkboxMatch[1].length + 3, checkboxMatch[0].length - 1]
            if ([colStart, colEnd].some(col => col < criticalStart || col > criticalEnd)) return

            evt.preventDefault()

            let done = evt.keyCode === 88
            let newLines = toggleDone(lines, index, index, done)
            let newValue = newLines.join('\n')

            let lineStart = str.reverseIndexOf(value, '\n', selectionStart - 1) + 1
            let newSelection = lineStart + checkboxMatch[1].length + 4

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
                onUndo={this.props.onUndo}
                onRedo={this.props.onRedo}
                onSelectionChange={this.props.onSelectionChange}
                onKeyDown={this.handleKeyDown}
            />
        </section>
    }
}
