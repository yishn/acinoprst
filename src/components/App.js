import {h, render, Component} from 'preact'
import hash from 'string-hash'
import * as doclist from '../doclist'
import GitHub, {extractUrlInfo} from '../github'
import History from '../history'
import * as outline from '../outline'
import * as storage from '../storage'

import Toolbar, {ToolbarButton, ToolbarSeparator} from './Toolbar'
import MenuPanel from './MenuPanel'
import DocumentView from './DocumentView'
import BusyScreen from './BusyScreen'

export default class App extends Component {
    history = new History()

    state = {
        busy: [],
        oldContentHash: null,
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

        try {
            let credentials = JSON.parse(atob(storage.get('credentials')))
            this.login(credentials)
        } catch(_) {
            storage.set('credentials', null)
        }

        // Events

        document.addEventListener('keydown', evt => {
            if (this.state.busy.length > 0) return

            if (evt.keyCode === 83 && evt.ctrlKey) {
                // Ctrl+S
                // Push

                evt.preventDefault()
                this.pushClick()
            } else if (evt.keyCode === 79 && evt.ctrlKey) {
                // Ctrl+O
                // Open menu panel

                evt.preventDefault()
                this.showMenu()
            } else if (evt.keyCode === 78 && evt.ctrlKey) {
                // Ctrl+N
                // Add new document

                evt.preventDefault()
                this.addNewDoc()
            } else if ((evt.keyCode === 90 || evt.keyCode === 89) && evt.ctrlKey) {
                // Ctrl+(Shift)+Z/Y
                // Undo/Redo

                evt.preventDefault()

                let step = evt.keyCode === 90 ? -1 : 1
                if (evt.shiftKey) step = -step

                this.stepInHistory(step)
            }
        })

        window.addEventListener('beforeunload', evt => {
            if (this.state.oldContentHash === this.getContentHash()) return

            let message = 'You have made unsaved changes. Do you really want to leave?'
            evt.returnValue = message
        })
    }

    getContentHash() {
        return hash(doclist.stringify(this.state.docs))
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

            let docs = doclist.parse(content)

            this.updateDocs({docs})
            this.updateCurrentIndex({currentIndex: Math.min(docs.length - 1, this.state.currentIndex)})
            this.setState({oldContentHash: this.getContentHash()})
        })
    }

    push = () => {
        if (this.state.oldContentHash === this.getContentHash())
            return Promise.resolve()

        return this.client.editGist(this.gistId, {
            files: {
                [this.gistFilename]: {
                    content: doclist.stringify(this.state.docs)
                }
            }
        }).then(() => {
            this.setState({oldContentHash: this.getContentHash()})
        })
    }

    login = ({createGist = false, profileUrl, gistUrl, accessToken}) => {
        this.startBusy()

        if (createGist) {
            let {user, host} = extractUrlInfo(profileUrl, false)
            let client = new GitHub({host, user, pass: accessToken})

            return client.createGist({
                description: 'Gist created by acinoprst',
                files: {
                    'acinoprst.md': {
                        content: '# Untitled'
                    }
                }
            }).then(({id}) => {
                this.endBusy()

                return this.login({
                    gistUrl: `https://${host}/${user}/${id}`,
                    accessToken
                })
            })
        }

        storage.set('credentials', btoa(JSON.stringify({gistUrl, accessToken})))

        return Promise.resolve().then(() => {
            let {id, user, host} = extractUrlInfo(gistUrl, true)
            this.client = new GitHub({host, user, pass: accessToken})
            this.gistId = id
            this.gistUrl = gistUrl
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
        storage.set('credentials', null)

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

        this.setState({docs})
        this.recordHistory()
    }

    permutateDocs = ({permutation}) => {
        if (permutation.every((x, i) => x === i)) return

        this.updateDocs({docs: permutation.map(i => this.state.docs[i])})
        this.updateCurrentIndex({currentIndex: permutation.indexOf(this.state.currentIndex)})
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
        this.updateDocs({docs: doclist.update(docs, currentIndex, doc)})
    }

    removeDoc = ({index}) => {
        let {docs, currentIndex} = this.state
        let result = confirm('Do you really want to remove this document?')
        if (!result) return

        this.updateDocs({docs: doclist.remove(docs, index)})
        this.updateCurrentIndex({
            currentIndex: index === currentIndex
                ? Math.max(0, currentIndex - 1)
                : Math.min(currentIndex, docs.length - 2)
        })
    }

    addNewDoc = () => {
        let {docs} = this.state
        let newDocs = doclist.append(docs, '')

        this.updateDocs({docs: newDocs})
        this.updateCurrentIndex({currentIndex: newDocs.length - 1})
        this.hideMenu()

        this.setState({}, () => {
            document.querySelector('.document-view-header h1 input').focus()
        })
    }

    handleDocumentClick = ({index}) => {
        this.updateCurrentIndex({currentIndex: index})
        this.hideMenu()

        this.setState({}, () => {
            document.querySelector('.document-view .outline-view').focus()
        })
    }

    handleOpenGist = () => {
        let a = render((
            <a style={{display: 'none'}} href={this.gistUrl} target="_blank"/>
        ), document.body)

        a.click()
        a.remove()
    }

    render() {
        let doc = this.getCurrentDoc()

        return <section id="app">
            <MenuPanel
                user={this.state.user}
                show={this.state.showMenu}
                docs={this.state.docs}
                currentIndex={this.state.currentIndex}

                onNewDocumentClick={this.addNewDoc}
                onDocumentClick={this.handleDocumentClick}
                onDocumentRemove={this.removeDoc}
                onPermutation={this.permutateDocs}
                onOpenGistClick={this.handleOpenGist}
                onLogin={this.login}
                onLogout={this.logout}
            />

            <DocumentView
                disabled={doc == null || this.state.user == null}
                doc={doc || {title: '', list: []}}
                selectedIds={this.state.selectedIds}

                headerToolbar={
                    <Toolbar disabled={this.state.user == null}>
                        <ToolbarButton
                            key="pull"
                            type={this.state.busy.includes('pull') && 'sync'}
                            icon={`./img/${this.state.busy.includes('pull') ? 'sync' : 'down'}.svg`}
                            tooltip="Pull"
                            onClick={this.pullClick}
                        />
                        {this.state.oldContentHash !== this.getContentHash() && <ToolbarButton
                            key="push"
                            type={this.state.busy.includes('push') && 'sync'}
                            icon={`./img/${this.state.busy.includes('push') ? 'sync' : 'up'}.svg`}
                            tooltip="Push"
                            onClick={this.pushClick}
                        />}

                        <ToolbarSeparator/>

                        <ToolbarButton
                            icon="./img/undo.svg"
                            tooltip="Undo"
                            disabled={!this.history.isUndoable()}
                            onClick={this.undo}
                        />
                        <ToolbarButton
                            icon="./img/redo.svg"
                            tooltip="Redo"
                            disabled={!this.history.isRedoable()}
                            onClick={this.redo}
                        />
                    </Toolbar>
                }

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
