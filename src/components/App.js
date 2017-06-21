import {h, Component} from 'preact'
import * as outline from '../outline'

import Headline from './Headline'
import Outliner from './Outliner'
import Sidebar from './Sidebar'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            current: 0,
            files: [
                {
                    title: 'Sample Outline',
                    content: outline.reformat([
                        '- [ ] Hello World!',
                        '    - [x] Hello',
                        '        - With some description',
                        '    - [ ] World!',
                        '        - With some more description',
                        '        - With some more description 2'
                    ].join('\n'))
                },
                {
                    title: 'Testing',
                    content: outline.reformat([
                        '- [ ] Hello World!',
                        '- [x] Hello',
                        '    - With some description',
                        '- [x] World!',
                        '    - With some more description',
                        '    - With some more description 2'
                    ].join('\n'))
                }
            ],
            sidebarWidth: 200
        }

        this.handleHeadlineChange = evt => {
            this.setState(({current, files}) => ({
                files: (files[current].title = evt.value, files)
            }))
        }

        this.handleOutlinerChange = evt => {
            let {element, value, selectionStart, selectionEnd} = evt

            element.value = value
            element.selectionStart = selectionStart
            element.selectionEnd = selectionEnd

            this.setState(({current, files}) => ({
                files: (files[current].content = value, files)
            }))
        }

        this.handleSidebarSelectionChange = evt => {
            this.setState({current: evt.selected})
        }

        this.handleSidebarWidthChange = evt => {
            this.setState({sidebarWidth: evt.width})
        }
    }

    render() {
        let currentFile = this.state.files[this.state.current]

        return <section id="app">
            <Sidebar
                width={this.state.sidebarWidth}
                items={this.state.files.map(x => x.title)}
                selected={this.state.current}
                onSelectionChange={this.handleSidebarSelectionChange}
                onWidthChange={this.handleSidebarWidthChange}
            />

            <main style={{left: this.state.sidebarWidth}}>
                <Headline
                    value={currentFile.title}
                    content={currentFile.content}
                    onChange={this.handleHeadlineChange}
                />

                <Outliner
                    value={currentFile.content}
                    onChange={this.handleOutlinerChange}
                />
            </main>
        </section>
    }
}
