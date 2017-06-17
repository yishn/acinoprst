import {h, Component} from 'preact'
import {reformat} from '../outline'

import Outliner from './Outliner'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            content: reformat([
                '- [ ] Hello World!',
                '    - [x] Hello',
                '        - With some description',
                '    - [ ] World!',
                '        - With some more description',
                '        - With some more description 2'
            ].join('\n'))
        }

        this.handleOutlinerChange = evt => {
            evt.element.value = evt.value
            evt.element.selectionStart = evt.selectionStart
            evt.element.selectionEnd = evt.selectionEnd

            this.setState({content: evt.value})
        }
    }

    render() {
        return <section id="app">
            <Outliner
                value={this.state.content}
                onChange={this.handleOutlinerChange}
            />
        </section>
    }
}
