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

    updateState(reducer, ...args) {
        this.setState(state => reducer(state, ...args))
    }

    handleHeadlineChange = evt => {
        this.updateState(appState.updateHeadline, this.state.current, evt.value)
    }

    handleOutlinerChange = evt => {
        let {element, value, selectionStart, selectionEnd} = evt

        element.value = value
        element.selectionStart = selectionStart
        element.selectionEnd = selectionEnd

        this.updateState(appState.updateFileContent, this.state.current, value)
    }

    handleNewFileClick = () => {
        this.updateState(appState.newFile)
    }

    handleRemoveFileClick = () => {
        if (!confirm('Do you really want to remove the current file?')) return
        this.updateState(appState.removeFile, this.state.current)
    }

    handleSidebarSelectionChange = evt => {
        this.updateState(appState.openFile, evt.selected)
    }

    handleSidebarOrderChange = evt => {
        this.updateState(appState.permutateFiles, evt.permutation)
    }

    handleSidebarWidthChange = evt => {
        this.updateState(appState.updateSidebarWidth, evt.width)
    }

    handleReformatClick = () => {
        this.updateState(appState.reformat, this.state.current)
    }

    handleSeparateItemsClick = () => {
        this.updateState(appState.separateItems, this.state.current)
    }

    handleRemoveDoneClick = () => {
        this.updateState(appState.removeDoneTasks, this.state.current)
    }

    render() {
        let currentFile = this.state.files[this.state.current]

        return <section id="app">
            <Sidebar
                width={this.state.sidebarWidth}
                items={this.state.files.map(x => x.title)}
                selected={this.state.current}

                onNewFileClick={this.handleNewFileClick}
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
                    <MenuItem onClick={this.handleReformatClick}>Reformat</MenuItem>
                    <MenuItem onClick={this.handleSeparateItemsClick}>Separate Items</MenuItem>
                    <MenuItem onClick={this.handleRemoveDoneClick}>Remove Done</MenuItem>
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
