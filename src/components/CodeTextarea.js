import {h, Component} from 'preact'
import {start as startSelectionChange} from 'selectionchange-polyfill'

startSelectionChange()

function reverseIndexOf(haystack, predicate, index) {
    if (!(predicate instanceof Function)) {
        let needle = predicate
        predicate = x => x === needle
    }

    for (let i = index; i >= 0; i--) {
        if (predicate(haystack[i])) return i
    }

    return -1
}

function getIndent(haystack, index) {
    let indent = 0

    for (let i = index; i < haystack.length; i++) {
        if (haystack[i] === ' ') indent++
        else break
    }

    return indent
}

function rangedIndexOf(haystack, needle, start, end) {
    let indices = []

    for (let i = Math.max(start, 0); i < Math.min(haystack.length, end); i++) {
        if (haystack[i] === needle) indices.push(i)
    }

    return indices
}

export default class CodeTextarea extends Component {
    constructor() {
        super()
    }

    componentDidMount() {
        document.addEventListener('selectionchange', this.handleSelectionChange)
    }

    componentWillUnmount() {
        document.removeEventListener('selectionchange', this.handleSelectionChange)
    }

    handleInput = evt => {
        let {onChange = () => {}} = this.props
        let {value, selectionStart, selectionEnd} = evt.currentTarget

        onChange({value, selectionStart, selectionEnd})
    }

    handleKeyDown = evt => {
        if ([9, 13, 36].includes(evt.keyCode)
        || [38, 40].includes(evt.keyCode) && evt.ctrlKey)
            evt.preventDefault()
        else return

        let {value, onChange = () => {}} = this.props
        let {selectionStart, selectionEnd} = evt.currentTarget

        if (evt.keyCode === 9) {
            // Tab

            let lineStart = reverseIndexOf(value, '\n', selectionStart - 1)
            let newlines = rangedIndexOf(value, '\n', lineStart, selectionEnd)
            let firstLineSelection = lineStart < 0

            if (newlines[newlines.length - 1] !== value.length - 1)
            newlines.push(value.length - 1)

            let chunks = newlines.reduce((acc, i, j) => [
                ...acc,
                value.slice((newlines[j - 1] || -1) + 1, i + 1)
            ], [])

            let currentContentLine = chunks.find((x, i) => i > 0 && x.trim() !== '')
            let currentIndent = currentContentLine != null ? getIndent(currentContentLine, 0) : 0

            chunks = chunks.map((x, i) => !firstLineSelection && i === 0 ? x :
                evt.shiftKey
                // Deindent
                ? x.slice(Math.min(getIndent(x, 0), 4))
                // Indent
                : Array(4).fill(' ').join('') + x
            )

            let newValue = chunks.join('')

            // Correct cursor position

            if (selectionStart !== selectionEnd) {
                let endLineStart = newValue.length - chunks[chunks.length - 1].length
                let endLineEnd = endLineStart + newValue.slice(endLineStart).indexOf('\n')

                selectionStart = firstLineSelection ? 0 : chunks[0].length
                selectionEnd = endLineEnd
            } else {
                let sign = evt.shiftKey ? -1 : 1
                let diff = evt.shiftKey ? Math.min(currentIndent, 4) : 4

                selectionStart = selectionEnd = selectionStart + sign * diff
            }

            onChange({value: newValue, selectionStart, selectionEnd})
        } else if (evt.keyCode === 36) {
            // Home

            let caretPosition = 0

            if (!evt.ctrlKey) {
                let lineStart = reverseIndexOf(value, '\n', selectionStart - 1)
                let indent = getIndent(value, lineStart + 1)

                caretPosition = lineStart + 1 + indent
                if (caretPosition === selectionStart) caretPosition = lineStart + 1
            }

            selectionStart = caretPosition
            if (!evt.shiftKey) selectionEnd = caretPosition

            onChange({value, selectionStart, selectionEnd})
        } else if (evt.keyCode === 13) {
            // Enter

            let lineStart = reverseIndexOf(value, '\n', selectionStart - 1)
            let indent = getIndent(value, lineStart + 1)
            let chunks = [value.slice(0, selectionStart), value.slice(selectionEnd)]
            let newValue = chunks.join('\n' + Array(indent).fill(' ').join(''))

            selectionStart = selectionEnd = chunks[0].length + indent + 1

            onChange({value: newValue, selectionStart, selectionEnd})
        } else if ([38, 40].includes(evt.keyCode) && evt.ctrlKey) {
            // Up & down arrow

            evt.preventDefault()

            let sign = evt.keyCode === 38 ? -1 : 1
            let lines = value.split('\n')
            let [rowStart, ] = this.getTextPositionFromIndex(selectionStart)
            let [rowEnd, ] = this.getTextPositionFromIndex(selectionEnd)

            rowStart--
            rowEnd--

            let moveRow = sign > 0 ? rowEnd + 1 : rowStart - 1
            if (moveRow < 0 || moveRow >= lines.length) return

            let moveLine = lines[moveRow]
            let selectionDiff = moveLine.length + 1

            if (sign > 0) {
                lines.splice(rowStart, 0, moveLine)
                lines.splice(moveRow + 1, 1)
            } else {
                lines.splice(rowEnd + 1, 0, moveLine)
                lines.splice(moveRow, 1)
            }

            selectionStart += sign * selectionDiff
            selectionEnd += sign * selectionDiff

            onChange({value: lines.join('\n'), selectionStart, selectionEnd})
        }

        let {onKeyDown = () => {}} = this.props
        onKeyDown(evt)
    }

    handleSelectionChange = () => {
        if (document.activeElement !== this.element) return

        let {onSelectionChange = () => {}} = this.props
        let {selectionStart, selectionEnd} = this.element

        onSelectionChange({
            startIndex: selectionStart,
            endIndex: selectionEnd,
            start: this.getTextPositionFromIndex(selectionStart),
            end: this.getTextPositionFromIndex(selectionEnd)
        })
    }

    getTextPositionFromIndex(index) {
        let {value} = this.element
        let slicedValue = [...value.slice(0, index)]

        let row = slicedValue.filter(x => x === '\n').length + 1
        let col = slicedValue.reverse().indexOf('\n')
        if (col < 0) col = slicedValue.length

        return [row, col]
    }

    render() {
        return <textarea
            {...this.props}

            ref={el => this.element = el}
            onChange={null}
            onKeyDown={this.handleKeyDown}
            onInput={this.handleInput}
        />
    }
}
