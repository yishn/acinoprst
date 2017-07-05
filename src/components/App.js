import {h, Component} from 'preact'
import * as appState from '../appState'

import Headline, {ToolbarButton, MenuItem} from './Headline'
import Outliner from './Outliner'
import Sidebar from './Sidebar'

export default class App extends Component {
    constructor() {
        super()

        this.state = appState.initState

        for (let action in appState) {
            if (typeof appState[action] !== 'function') continue

            this[action] = (...args) => {
                this.setState(state => appState[action](state, ...args))
            }
        }
    }

    componentDidUpdate(_, prevState) {
        let textarea = document.querySelector('#outliner textarea')
        let selectionChanged = false

        if (prevState.selectionStart !== this.state.selectionStart
        || textarea.selectionStart !== this.state.selectionStart) {
            textarea.selectionStart = this.state.selectionStart
            selectionChanged = true
        }

        if (prevState.selectionEnd !== this.state.selectionEnd
        || textarea.selectionEnd !== this.state.selectionEnd) {
            textarea.selectionEnd = this.state.selectionEnd
            selectionChanged = true
        }

        if (selectionChanged) {
            textarea.focus()
        }
    }

    handleHeadlineChange = evt => {
        this.updateFileTitle(this.state.current, evt.value)
    }

    handleOutlinerChange = evt => {
        let {value, selectionStart, selectionEnd} = evt

        this.updateFileContent(this.state.current, value, selectionStart, selectionEnd)
    }

    handleOutlinerSelectionChange = evt => {
        let {startIndex, endIndex} = evt

        this.updateSelection(startIndex, endIndex)
    }

    handleNewFileClick = () => {
        this.newFile()
    }

    handleRemoveFileClick = () => {
        if (!confirm('Do you really want to remove the current file?')) return
        this.removeFile(this.state.current)
    }

    handleSidebarSelectionChange = evt => {
        this.openFile(evt.selected)
        this.reformat(evt.selected)
    }

    handleSidebarOrderChange = evt => {
        this.permutateFiles(evt.permutation)
    }

    handleSidebarWidthChange = evt => {
        this.updateSidebarWidth(evt.width)
    }

    handleReformatClick = () => {
        this.reformat(this.state.current)
    }

    handleSeparateItemsClick = () => {
        this.separateItems(this.state.current)
    }

    handleRemoveDoneClick = () => {
        this.removeDoneTasks(this.state.current)
    }

    handleUndoClick = () => {
        this.traverseEditHistory(-1)
    }

    handleRedoClick = () => {
        this.traverseEditHistory(1)
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
                    <ToolbarButton
                        text="Undo"
                        icon="mail-reply"
                        disabled={this.state.historyPointer === 0}
                        onClick={this.handleUndoClick}
                    />

                    <ToolbarButton
                        text="Redo"
                        icon="mail-reply"
                        disabled={this.state.historyPointer === this.state.history.length - 1}
                        onClick={this.handleRedoClick}
                    />

                    <ToolbarButton text="File Actions" icon="three-bars">
                        <MenuItem onClick={this.handleReformatClick}>Reformat</MenuItem>
                        <MenuItem onClick={this.handleSeparateItemsClick}>Separate Items</MenuItem>
                        <MenuItem onClick={this.handleRemoveDoneClick}>Remove Done</MenuItem>
                        <MenuItem type="separator" />
                        <MenuItem onClick={this.handleRemoveFileClick}>Remove File</MenuItem>
                    </ToolbarButton>
                </Headline>

                <Outliner
                    value={currentFile.content}
                    onChange={this.handleOutlinerChange}
                    onSelectionChange={this.handleOutlinerSelectionChange}
                />
            </main>
        </section>
    }
}
