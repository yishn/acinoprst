import {h, Component} from 'preact'
import * as outline from '../outline'
import {parse} from '../doclist'
import {getGistInfo} from '../github'
import History from '../history'

import {ToolbarButton} from './Toolbar'
import MenuPanel from './MenuPanel'
import DocumentView from './DocumentView'
import BusyScreen from './BusyScreen'

export default class App extends Component {
    history = new History()

    state = {
        busy: 0,
        user: null,
        showMenu: true,
        currentIndex: 0,
        docs: [],
        selectedIds: []
    }

    constructor() {
        super()

        window.app = this
        this.recordHistory()
    }

    login = ({gistUrl, accessToken}) => {
        this.pushBusy()

        getGistInfo(gistUrl).then(({client, url, id, user, avatar, content}) => {
            this.setState({
                user: {
                    avatar,
                    name: user,
                    gistUrl: url,
                    gistId: id,
                    client: client.setAuthorization(user, accessToken)
                }
            })

            this.updateDocs({docs: parse(content)})
            this.updateCurrentIndex({currentIndex: 0})

            this.history.clear()
            this.recordHistory()
        }).catch(err => {
            alert(`Loading of gist failed.\n\n${err}`)
            this.logout()
        }).then(() => {
            this.popBusy()
        })
    }

    logout = () => {
        this.setState({user: null, docs: []})
    }

    pull = () => {
        this.pushBusy()

        let {gistUrl, client} = this.state.user

        getGistInfo(this.state.user.gistUrl, client).then(({content}) => {
            this.updateDocs({docs: parse(content)})
        }).catch(err => {
            alert(`Loading of gist failed.\n\n${err}`)
        }).then(() => {
            this.popBusy()
        })
    }

    pushBusy = () => {
        this.setState(({busy}) => ({busy: busy + 1}))
    }

    popBusy = () => {
        this.setState(({busy}) => ({busy: Math.max(busy - 1, 0)}))
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
                        icon="./img/down.svg"
                        text="Pull"
                        onClick={this.pull}
                    />,
                    <ToolbarButton
                        icon="./img/up.svg"
                        text="Push"
                        onClick={this.push}
                    />,
                    <ToolbarButton
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

            <BusyScreen show={this.state.busy > 0}/>
        </section>
    }
}
