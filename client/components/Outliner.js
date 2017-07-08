import {h, Component} from 'preact'

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
        if (evt.keyCode === 13) {
            // Insert list bullets when pressing enter

            let {value, selectionStart} = evt.currentTarget
            let {onChange = () => {}} = this.props
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
                element: evt.currentTarget,
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