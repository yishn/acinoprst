import {h, Component} from 'preact'
import cookies from 'js-cookie'
import githubAuthorize from '../github'
import * as appState from '../appState'
import {parseFiles, stringifyFiles} from '../outline'

import Headline, {ToolbarButton, MenuItem} from './Headline'
import Outliner from './Outliner'
import Sidebar from './Sidebar'
import Login from './Login'
import Busy from './Busy'

const github = githubAuthorize(cookies.get('oauth_token'))

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

    componentDidMount() {
        this.pullFiles()
    }

    componentDidUpdate(_, prevState) {
        let textarea = document.querySelector('#outliner textarea')
        let selectionChanged = false

        if (prevState.selectionStart !== this.state.selectionStart
        && textarea.selectionStart !== this.state.selectionStart) {
            textarea.selectionStart = this.state.selectionStart
            selectionChanged = true
        }

        if (prevState.selectionEnd !== this.state.selectionEnd
        && textarea.selectionEnd !== this.state.selectionEnd) {
            textarea.selectionEnd = this.state.selectionEnd
            selectionChanged = true
        }

        if (selectionChanged) {
            textarea.focus()
        }
    }

    pullFiles() {
        if (!this.state.loggedIn) return

        this.setBusy(true)

        github.pullAcinoprstGist()
        .then(data => {
            this.gistId = data.id
            this.loadFiles(parseFiles(data.file.content))
            this.setBusy(false)
        })
        .catch(this.handleLogoutClick)
    }

    pushFiles() {
        if (!this.state.loggedIn || this.gistId == null) return

        this.setBusy(true)

        github.pushAcinoprstGist(this.gistId, stringifyFiles(this.state.files))
        .then(data => {
            this.gistId = data.id
            this.setBusy(false)
        })
        .catch(this.handleLogoutClick)
    }

    handleHeadlineChange = evt => {
        this.setFileTitle(this.state.current, evt.value)
    }

    handleOutlinerChange = evt => {
        let {value, selectionStart, selectionEnd} = evt

        // This fixes weird bug where pressing enter doesn't insert new lines

        let textarea = document.querySelector('#outliner textarea')

        textarea.value = value
        textarea.selectionStart = selectionStart
        textarea.selectionEnd = selectionEnd

        this.setFileContent(this.state.current, value, selectionStart, selectionEnd)
    }

    handleOutlinerSelectionChange = evt => {
        let {startIndex, endIndex} = evt

        this.setSelection(startIndex, endIndex)
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
        this.setSidebarWidth(evt.width)
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

    handleLogoutClick = () => {
        window.location.replace(`${window.location.href}?logout`)
    }

    render() {
        let currentFile = this.state.files[this.state.current]

        return <section id="app">
            <Sidebar
                width={this.state.sidebarWidth}
                items={this.state.files.map(x => x.title)}
                selected={this.state.current}
                showToolbar={this.state.loggedIn}

                onNewFileClick={this.handleNewFileClick}
                onSelectionChange={this.handleSidebarSelectionChange}
                onOrderChange={this.handleSidebarOrderChange}
                onWidthChange={this.handleSidebarWidthChange}
            />

            {currentFile != null && this.state.loggedIn
                ? <main style={{left: this.state.sidebarWidth}}>
                    <Headline
                        value={currentFile.title}
                        content={currentFile.content}
                        onChange={this.handleHeadlineChange}
                    >
                        <ToolbarButton
                            text="Undo"
                            icon="mail-reply"
                            disabled={this.state.historyPointer <= 0}
                            onClick={this.handleUndoClick}
                        />

                        <ToolbarButton
                            text="Redo"
                            icon="mail-reply"
                            disabled={this.state.historyPointer >= this.state.history.length - 1}
                            onClick={this.handleRedoClick}
                        />

                        <ToolbarButton text="File Actions" icon="three-bars">
                            <MenuItem onClick={this.handleReformatClick}>Reformat</MenuItem>
                            <MenuItem onClick={this.handleSeparateItemsClick}>Separate Items</MenuItem>
                            <MenuItem onClick={this.handleRemoveDoneClick}>Remove Done</MenuItem>
                            <MenuItem type="separator" />
                            <MenuItem onClick={this.handleRemoveFileClick}>Remove File</MenuItem>
                            <MenuItem type="separator" />
                            <MenuItem onClick={this.handleLogoutClick}>Logout</MenuItem>
                        </ToolbarButton>
                    </Headline>

                    <Outliner
                        value={currentFile.content}
                        onChange={this.handleOutlinerChange}
                        onSelectionChange={this.handleOutlinerSelectionChange}
                    />
                </main>

                : <main style={{left: this.state.sidebarWidth}}>
                    {!this.state.loggedIn ? <Login/> : null}
                </main>
            }

            <Busy show={this.state.busy} />
        </section>
    }
}
