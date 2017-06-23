import {h, Component} from 'preact'
import * as appState from '../appState'

import Headline from './Headline'
import Outliner from './Outliner'
import Sidebar from './Sidebar'

export default class App extends Component {
    constructor() {
        super()

        this.state = appState.initState

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

        this.handleNewFileClick = evt => {
            evt.preventDefault()
            this.setState(state => appState.newFile(state))
        }

        this.handleRemoveFileClick = evt => {
            evt.preventDefault()

            if (!confirm('Do you really want to remove the current file?')) return
            this.setState(state => appState.removeFile(state))
        }

        this.handleSidebarSelectionChange = evt => {
            if (evt.selected === this.state.current) return

            this.setState(state => appState.openFile(state, evt.selected))
        }

        this.handleSidebarOrderChange = evt => {
            this.setState(state => appState.permutateFiles(state, evt.permutation))
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

                onNewFileClick={this.handleNewFileClick}
                onRemoveFileClick={this.handleRemoveFileClick}
                onSelectionChange={this.handleSidebarSelectionChange}
                onOrderChange={this.handleSidebarOrderChange}
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
