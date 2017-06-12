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

function rangedFilter(haystack, needle, start, end) {
    let indices = []

    for (let i = Math.max(start, 0); i < Math.min(haystack.length, end); i++) {
        if (haystack[i] === needle) indices.push(i)
    }

    return indices
}

export default class Textarea extends Component {
    constructor() {
        super()

        this.handleKeyDown = evt => {
            if ([9, 13, 36].includes(evt.keyCode)) evt.preventDefault()

            let {value, selectionStart, selectionEnd} = this.element

            if (evt.keyCode === 9) {
                // Tab

                let newlines = rangedFilter(value, '\n', selectionStart, selectionEnd)
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
                this.element.value = newValue

                // Correct cursor position

                if (selectionStart !== selectionEnd) {
                    let selectionLineStart = newValue.length - chunks[chunks.length - 1].length
                    let selectionLineEnd = selectionLineStart + newValue.slice(selectionLineStart).indexOf('\n')

                    this.element.selectionStart = chunks[0].length
                    this.element.selectionEnd = selectionLineEnd
                } else {
                    let sign = evt.shiftKey ? -1 : 1
                    let diff = evt.shiftKey ? Math.min(getIndent(value, newlines[0] + 1), 4) : 4

                    this.element.selectionStart = this.element.selectionEnd = selectionStart + sign * diff
                }
            } else if (evt.keyCode === 36) {
                // Home

                let caretPosition = 0

                if (!evt.ctrlKey) {
                    let lineStart = reverseIndexOf(value, '\n', selectionStart - 1)
                    let indent = getIndent(value, lineStart + 1)

                    caretPosition = lineStart + 1 + indent
                    if (caretPosition === selectionStart) caretPosition = lineStart + 1
                }

                this.element.selectionStart = caretPosition

                if (!evt.shiftKey) {
                    this.element.selectionEnd = caretPosition
                }
            } else if (evt.keyCode === 13) {
                // Enter

                let lineStart = reverseIndexOf(value, '\n', selectionStart - 1)
                let indent = getIndent(value, lineStart + 1)
                let chunks = [value.slice(0, selectionStart), value.slice(selectionEnd)]

                this.element.value = chunks.join('\n' + Array(indent).fill(' ').join(''))
                this.element.selectionStart = this.element.selectionEnd = chunks[0].length + indent + 1
            }

            let {onKeyDown = () => {}} = this.props
            onKeyDown(evt)
        }
    }

    render(props) {
        return <textarea
            {...props}

            ref={el => this.element = el}
            onKeyDown={this.handleKeyDown}
        />
    }
}
