import {h, Component} from 'preact'
import * as outline from '../outline'
import * as doclist from '../doclist'
import DocumentView from './DocumentView'

export default class App extends Component {
    state = {
        currentIndex: 0,
        docs: doclist.append(
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
        selectedIds: [0]
    }

    getCurrentDoc = () => {
        let {docs, currentIndex} = this.state
        return docs[currentIndex]
    }

    updateDocs = ({docs}) => this.setState({docs})
    updateCurrentIndex = ({currentIndex}) => this.setState({currentIndex})
    updateSelectedIds = ({selectedIds}) => this.setState({selectedIds})
    updateDoc = ({doc}) => {
        let {docs, currentIndex} = this.state
        this.updateDocs({docs: docs.map((x, i) => i === currentIndex ? doc : x)})
    }

    render() {
        let doc = this.getCurrentDoc()

        return <DocumentView
            doc={doc}
            selectedIds={this.state.selectedIds}

            onChange={this.updateDoc}
            onSelectionChange={this.updateSelectedIds}
        />
    }
}
