import {h, Component} from 'preact'

import Outliner from './Outliner'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            content: [
                '- [ ] Hello World!',
                '    - [x] Hello',
                '          With some description',
                '    - [ ] World!',
                ''
            ].join('\n')
        }

        this.handleOutlinerChange = evt => {
            this.setState({content: evt.value}, () => {
                evt.element.selectionStart = evt.selectionStart
                evt.element.selectionEnd = evt.selectionEnd
            })
        }
    }

    render() {
        return <section id="app">
            <Outliner
                content={this.state.content}
                onChange={this.handleOutlinerChange}
            />
        </section>
    }
}
