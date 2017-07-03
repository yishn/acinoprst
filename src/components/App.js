import {h, Component} from 'preact'
import * as appState from '../appState'

import Headline, {ToolbarButton, MenuItem} from './Headline'
import Outliner from './Outliner'
import Sidebar from './Sidebar'

export default class App extends Component {
    constructor() {
        super()

        this.state = appState.initState
    }

    updateState(action, ...args) {
        this.setState(state => appState[action](state, ...args))
    }

    handleHeadlineChange = evt => {
        this.updateState('updateHeadline', this.state.current, evt.value)
    }

    handleOutlinerChange = evt => {
        let {element, value, selectionStart, selectionEnd} = evt

        element.value = value
        element.selectionStart = selectionStart
        element.selectionEnd = selectionEnd

        this.updateState('updateFileContent', this.state.current, value)
    }

    handleNewFileClick = () => {
        this.updateState('newFile')
    }

    handleRemoveFileClick = () => {
        if (!confirm('Do you really want to remove the current file?')) return
        this.updateState('removeFile', this.state.current)
    }

    handleSidebarSelectionChange = evt => {
        this.updateState('openFile', evt.selected)
        this.updateState('reformat', evt.selected)
    }

    handleSidebarOrderChange = evt => {
        this.updateState('permutateFiles', evt.permutation)
    }

    handleSidebarWidthChange = evt => {
        this.updateState('updateSidebarWidth', evt.width)
    }

    handleReformatClick = () => {
        this.updateState('reformat', this.state.current)
    }

    handleSeparateItemsClick = () => {
        this.updateState('separateItems', this.state.current)
    }

    handleRemoveDoneClick = () => {
        this.updateState('removeDoneTasks', this.state.current)
    }

    handleUndoClick = () => {
        this.updateState('traverseEditHistory', -1)
    }

    handleRedoClick = () => {
        this.updateState('traverseEditHistory', 1)
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
                        onClick={this.handleUndoClick}
                    />

                    <ToolbarButton
                        text="Redo"
                        icon="mail-reply"
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
                />
            </main>
        </section>
    }
}
