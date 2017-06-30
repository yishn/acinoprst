import {h, Component} from 'preact'
import * as appState from '../appState'

import Headline from './Headline'
import Outliner from './Outliner'
import Sidebar from './Sidebar'
import {MenuItem} from './Menu'

export default class App extends Component {
    constructor() {
        super()

        this.state = appState.initState
    }

    handleHeadlineChange = evt => {
        this.setState(({current, files}) => ({
            files: (files[current].title = evt.value, files)
        }))
    }

    handleOutlinerChange = evt => {
        let {element, value, selectionStart, selectionEnd} = evt

        element.value = value
        element.selectionStart = selectionStart
        element.selectionEnd = selectionEnd

        this.setState(({current, files}) => ({
            files: (files[current].content = value, files)
        }))
    }

    handleNewFileClick = evt => {
        this.setState(appState.newFile)
    }

    handleRemoveFileClick = evt => {
        if (!confirm('Do you really want to remove the current file?')) return
        this.setState(appState.removeFile)
    }

    handleSidebarSelectionChange = evt => {
        this.setState(state => appState.openFile(state, evt.selected))
    }

    handleSidebarOrderChange = evt => {
        this.setState(state => appState.permutateFiles(state, evt.permutation))
    }

    handleSidebarWidthChange = evt => {
        this.setState({sidebarWidth: Math.min(Math.max(evt.width, 100), 400)})
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
                >
                    <MenuItem>Reformat</MenuItem>
                    <MenuItem>Separate Done</MenuItem>
                    <MenuItem>Remove Done</MenuItem>
                    <MenuItem type="separator" />
                    <MenuItem onClick={this.handleRemoveFileClick}>Remove File</MenuItem>
                </Headline>

                <Outliner
                    value={currentFile.content}
                    onChange={this.handleOutlinerChange}
                />
            </main>
        </section>
    }
}
