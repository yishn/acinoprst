import {h, Component} from 'preact'
import * as outline from '../outline'
import {parse, stringify} from '../doclist'
import GitHub, {extractGistInfo} from '../github'
import History from '../history'

import {ToolbarButton} from './Toolbar'
import MenuPanel from './MenuPanel'
import DocumentView from './DocumentView'
import BusyScreen from './BusyScreen'

export default class App extends Component {
    history = new History()

    state = {
        busy: [],
        changed: false,
        user: null,
        showMenu: true,
        currentIndex: 0,
        docs: [],
        selectedIds: []
    }

    constructor() {
        super()

        this.recordHistory()
    }

    componentDidMount() {
        // Auto login

        let credentials = JSON.parse(localStorage.getItem('acinoprst_credentials'))
        if (credentials != null) this.login(credentials)
    }

    pull = () => {
        return this.client.getGist(this.gistId).then(gist => {
            let filename = Object.keys(gist.files)[0]

            return this.client.getGistFileContent(gist, filename).then(content => {
                return {gist, filename, content}
            })
        })
        .then(({gist, filename, content}) => {
            this.gistFilename = filename

            this.setState({
                user: {
                    avatar: gist.owner.avatar_url,
                    name: gist.owner.login
                }
            })

            this.updateDocs({docs: parse(content)})
            this.setState({changed: false})
        })
    }

    push = () => {
        return this.client.editGist(this.gistId, {
            files: {
                [this.gistFilename]: {
                    content: stringify(this.state.docs)
                }
            }
        }).then(() => {
            this.setState({changed: false})
        })
    }

    login = ({gistUrl, accessToken}) => {
        this.startBusy()

        localStorage.setItem('acinoprst_credentials', JSON.stringify({gistUrl, accessToken}))

        return Promise.resolve().then(() => {
            let {id, user, host} = extractGistInfo(gistUrl)
            this.client = new GitHub({host, user, pass: accessToken})
            this.gistId = id
        }).then(() => {
            return this.pull()
        }).then(() => {
            this.updateCurrentIndex({currentIndex: 0})
            this.history.clear()
            this.recordHistory()
        }).catch(err => {
            alert(`Login failed.\n\n${err}`)
            this.logout()
        })
        .then(() => this.endBusy())
    }

    logout = () => {
        localStorage.removeItem('acinoprst_credentials')

        this.client = null
        this.setState({user: null, docs: []})
    }

    pullClick = () => {
        this.startBusy('pull')

        return this.pull().catch(err => {
            alert(`Loading of gist failed.\n\n${err}`)
        })
        .then(() => this.endBusy())
    }

    pushClick = () => {
        this.startBusy('push')

        return this.push().catch(err => {
            alert(`Updating gist failed.\n\n${err}`)
        }).then(() => {
            this.endBusy()
        })
    }

    startBusy = type => {
        this.setState(s => ({busy: (s.busy.push(type), s.busy)}))
    }

    endBusy = () => {
        this.setState(s => ({busy: (s.busy.pop(), s.busy)}))
    }

    getCurrentDoc = () => {
        let {docs, currentIndex} = this.state
        return docs[currentIndex]
    }

    recordHistory = () => {
        this.history.push({...this.state})
    }

    stepInHistory = step => {
        let entry = this.history.step(step)
        if (entry == null) return

        let {currentIndex, docs, selectedIds} = entry
        this.setState({currentIndex, docs, selectedIds})
    }

    undo = () => this.stepInHistory(-1)
    redo = () => this.stepInHistory(1)

    showMenu = () => {
        this.setState({showMenu: true})
    }

    hideMenu = () => {
        this.setState({showMenu: false})
    }

    updateDocs = ({docs}) => {
        if (docs === this.state.docs) return

        this.setState({docs, changed: true})
        this.recordHistory()
    }

    updateCurrentIndex = ({currentIndex}) => {
        if (currentIndex === this.state.currentIndex) return

        let currentDoc = this.state.docs[currentIndex]

        this.setState({
            currentIndex,
            selectedIds: currentDoc == null ? [] : currentDoc.list.slice(0, 1).map(item => item.id)
        })

        this.recordHistory()
    }

    updateSelectedIds = ({selectedIds}) => {
        this.setState({selectedIds})
    }

    updateDoc = ({doc}) => {
        let {docs, currentIndex} = this.state
        this.updateDocs({docs: docs.map((x, i) => i === currentIndex ? doc : x)})
    }

    removeDoc = () => {
        let {docs, currentIndex} = this.state
        let result = confirm('Do you really want to remove this document?')
        if (!result) return

        this.updateDocs({docs: docs.filter((_, i) => i !== currentIndex)})
        this.updateCurrentIndex({currentIndex: Math.max(0, currentIndex - 1)})
    }

    handleDocumentClick = ({index}) => {
        this.updateCurrentIndex({currentIndex: index})
        this.hideMenu()
    }

    render() {
        let doc = this.getCurrentDoc()

        return <section id="app">
            <MenuPanel
                user={this.state.user}
                show={this.state.showMenu}
                docs={this.state.docs}
                currentIndex={this.state.currentIndex}

                onDocumentClick={this.handleDocumentClick}
                onDocumentsChange={this.updateDocs}
                onLogin={this.login}
                onLogout={this.logout}
            />

            <DocumentView
                disabled={doc == null || this.state.user == null}
                doc={doc || {title: '', list: []}}
                selectedIds={this.state.selectedIds}
                undoable={this.history.isUndoable()}
                redoable={this.history.isRedoable()}

                headerButtons={[
                    <ToolbarButton
                        key="pull"
                        type={this.state.busy.includes('pull') && 'sync'}
                        icon={`./img/${this.state.busy.includes('pull') ? 'sync' : 'down'}.svg`}
                        text="Pull"
                        onClick={this.pullClick}
                    />,
                    this.state.changed && <ToolbarButton
                        key="push"
                        type={this.state.busy.includes('push') && 'sync'}
                        icon={`./img/${this.state.busy.includes('push') ? 'sync' : 'up'}.svg`}
                        text="Push"
                        onClick={this.pushClick}
                    />,
                    <ToolbarButton
                        key="remove"
                        icon="./img/trash.svg"
                        text="Remove"
                        onClick={this.removeDoc}
                    />
                ]}

                onMenuButtonClick={this.showMenu}
                onChange={this.updateDoc}
                onSelectionChange={this.updateSelectedIds}
                onUndo={this.undo}
                onRedo={this.redo}
            />

            <BusyScreen show={this.state.busy.length > 0}/>
        </section>
    }
}
