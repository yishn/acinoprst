import {h, Component} from 'preact'

function reverseIndexOf(haystack, needle, index) {
    for (let i = index; i >= 0; i--) {
        if (haystack[i] === needle) return i
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

        this.handleInput = evt => {
            let {onChange = () => {}} = this.props
            let {value, selectionStart, selectionEnd} = evt.currentTarget

            onChange({element: evt.currentTarget, value, selectionStart, selectionEnd})
        }

        this.handleKeyDown = evt => {
            if ([9, 13, 36].includes(evt.keyCode)) evt.preventDefault()
            else return

            let {value, onChange = () => {}} = this.props
            let {selectionStart, selectionEnd} = this.element

            if (evt.keyCode === 9) {
                // Tab

                let newlines = rangedIndexOf(value, '\n', selectionStart, selectionEnd)
                let prevLineStart = reverseIndexOf(value, '\n', selectionStart - 1)

                if (newlines[0] !== prevLineStart)
                    newlines.unshift(prevLineStart)
                if (newlines[newlines.length - 1] !== value.length - 1)
                    newlines.push(value.length - 1)

                let chunks = newlines.reduce((acc, i, j) => [
                    ...acc,
                    value.slice((newlines[j - 1] || -1) + 1, i + 1)
                ], []).map(
                    evt.shiftKey
                    // Deindent
                    ? (x, i) => i === 0 ? x : x.slice(Math.min(getIndent(x, 0), 4))
                    // Indent
                    : (x, i) => i === 0 ? x : Array(4).fill(' ').join('') + x
                )

                let newValue = chunks.join('')

                // Correct cursor position

                if (selectionStart !== selectionEnd) {
                    let endLineStart = newValue.length - chunks[chunks.length - 1].length
                    let endLineEnd = endLineStart + newValue.slice(endLineStart).indexOf('\n')

                    selectionStart = chunks[0].length
                    selectionEnd = endLineEnd
                } else {
                    let sign = evt.shiftKey ? -1 : 1
                    let diff = evt.shiftKey ? Math.min(getIndent(value, newlines[0] + 1), 4) : 4

                    selectionStart = selectionEnd = selectionStart + sign * diff
                }

                onChange({element: this.element, value: newValue, selectionStart, selectionEnd})
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

                onChange({element: this.element, value, selectionStart, selectionEnd})
            } else if (evt.keyCode === 13) {
                // Enter

                let lineStart = reverseIndexOf(value, '\n', selectionStart - 1)
                let indent = getIndent(value, lineStart + 1)
                let chunks = [value.slice(0, selectionStart), value.slice(selectionEnd)]
                let newValue = chunks.join('\n' + Array(indent).fill(' ').join(''))

                selectionStart = selectionEnd = chunks[0].length + indent + 1

                onChange({element: this.element, value: newValue, selectionStart, selectionEnd})
            }

            let {onKeyDown = () => {}} = this.props
            onKeyDown(evt)
        }
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
