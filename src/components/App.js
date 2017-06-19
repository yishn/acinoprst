import {h, Component} from 'preact'
import * as outline from '../outline'

import Headline from './Headline'
import Outliner from './Outliner'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            title: 'Sample Outline',
            content: outline.reformat([
                '- [ ] Hello World!',
                '    - [x] Hello',
                '        - With some description',
                '    - [ ] World!',
                '        - With some more description',
                '        - With some more description 2'
            ].join('\n'))
        }

        this.handleHeadlineChange = evt => {
            this.setState({title: evt.value})
        }

        this.handleOutlinerChange = evt => {
            let {element, value, selectionStart, selectionEnd} = evt

            element.value = value
            element.selectionStart = selectionStart
            element.selectionEnd = selectionEnd

            this.setState({content: value})
        }
    }

    render() {
        return <section id="app">
            <Headline
                value={this.state.title}
                onChange={this.handleHeadlineChange}
            />

            <Outliner
                value={this.state.content}
                onChange={this.handleOutlinerChange}
            />
        </section>
    }
}
