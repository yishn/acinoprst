import {h, Component} from 'preact'
import {pullAcinoprstGist, pushAcinoprstGist} from '../github'
import * as appState from '../appState'
import {parseFiles, stringifyFiles} from '../outline'

import Headline, {HeadlineButton, MenuItem} from './Headline'
import Outliner from './Outliner'
import Sidebar, {SidebarButton} from './Sidebar'
import Login from './Login'
import Busy from './Busy'

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
        if (this.state.authorization != null) {
            this.login(...this.state.authorization)
            this.pullFiles()
        }
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
        this.setBusy(true)

        pullAcinoprstGist()
        .then(data => {
            this.gistId = data.id
            this.loadFiles(parseFiles(data.file.content))
        })
        .catch(() => this.logout())
        .then(() => this.setBusy(false))
    }

    pushFiles() {
        if (this.gistId == null) return

        this.setBusy(true)

        pushAcinoprstGist(this.gistId, stringifyFiles(this.state.files))
        .then(data => {
            this.gistId = data.id
        })
        .catch(() => this.logout())
        .then(() => this.setBusy(false))
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
        this.setSelection(evt.startIndex, evt.endIndex)
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
        this.logout()
    }

    handleLogin = (evt) => {
        this.login(evt.user, evt.pass)
        this.pullFiles()
    }

    render() {
        let currentFile = this.state.files[this.state.current]

        return <section id="app">
            <Sidebar
                width={this.state.sidebarWidth}
                items={this.state.files.map(x => x.title)}
                selected={this.state.current}
                visible={this.state.authorization != null}

                onSelectionChange={this.handleSidebarSelectionChange}
                onOrderChange={this.handleSidebarOrderChange}
                onWidthChange={this.handleSidebarWidthChange}
            >
                <SidebarButton
                    text="New File"
                    icon="plus"
                    onClick={this.handleNewFileClick}
                />
            </Sidebar>

            {currentFile != null && this.state.authorization != null
                ? <main style={{left: this.state.sidebarWidth}}>
                    <Headline
                        value={currentFile.title}
                        content={currentFile.content}
                        onChange={this.handleHeadlineChange}
                    >
                        <HeadlineButton
                            text="Undo"
                            icon="mail-reply"
                            disabled={this.state.historyPointer <= 0}
                            onClick={this.handleUndoClick}
                        />

                        <HeadlineButton
                            text="Redo"
                            icon="mail-reply"
                            disabled={this.state.historyPointer >= this.state.history.length - 1}
                            onClick={this.handleRedoClick}
                        />

                        <HeadlineButton text="File Actions" icon="three-bars">
                            <MenuItem onClick={this.handleReformatClick}>Reformat</MenuItem>
                            <MenuItem onClick={this.handleSeparateItemsClick}>Separate Items</MenuItem>
                            <MenuItem onClick={this.handleRemoveDoneClick}>Remove Done</MenuItem>
                            <MenuItem type="separator" />
                            <MenuItem onClick={this.handleRemoveFileClick}>Remove File</MenuItem>
                            <MenuItem type="separator" />
                            <MenuItem onClick={this.handleLogoutClick}>Logout</MenuItem>
                        </HeadlineButton>
                    </Headline>

                    <Outliner
                        value={currentFile.content}
                        onChange={this.handleOutlinerChange}
                        onSelectionChange={this.handleOutlinerSelectionChange}
                    />
                </main>

                : <main style={{left: this.state.sidebarWidth}}>
                    {this.state.authorization == null &&
                        <Login
                            onLogin={this.handleLogin}
                        />
                    }
                </main>
            }

            <Busy show={this.state.busy} />
        </section>
    }
}
