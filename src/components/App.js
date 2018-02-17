import {h, Component} from 'preact'
import * as outline from '../outline'
import * as doclist from '../doclist'
import History from '../history'
import DocumentView, {ToolbarButton} from './DocumentView'

export default class App extends Component {
    history = new History()

    state = {
        currentIndex: 0,
        docs: (
            doclist.append([], 'Test', outline.parse([
                '- [ ] Hello',
                '    - [x] World',
                '- [x] Hey',
                '+ [ ] What is up',
                '    - [ ] Boom',
                '+ [ ] Hello',
                '    - [x] World',
                '- [x] Hey',
                '- [ ] What is up',
                '    - [ ] Boom',
                '        - [ ] Second Boom'
            ].join('\n')))
        ),
        selectedIds: [1]
    }

    constructor() {
        super()

        window.app = this
        this.recordHistory()
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

    updateDocs = ({docs}) => {
        this.setState({docs})
        this.recordHistory()
    }
    
    updateCurrentIndex = ({currentIndex}) => {
        this.setState({currentIndex, selectedIds: []})
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

    render() {
        let doc = this.getCurrentDoc()

        return <DocumentView
            disabled={doc == null}
            doc={doc || {title: '', list: []}}
            selectedIds={this.state.selectedIds}

            onMenuButtonClick={console.log}
            onChange={this.updateDoc}
            onRemove={this.removeDoc}
            onSelectionChange={this.updateSelectedIds}
            onUndo={this.undo}
            onRedo={this.redo}
        />
    }
}
