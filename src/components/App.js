import {h, Component} from 'preact'
import * as outline from '../outline'
import * as doclist from '../doclist'
import DocumentView from './DocumentView'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
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
                    '    - [ ] Boom'
                ].join('\n')))
            )
        }
    }

    getCurrentDoc = () => {
        let {docs, currentIndex} = this.state
        return docs[currentIndex]
    }

    updateDoc = ({doc}) => {
        let {docs, currentIndex} = this.state

        this.setState({
            docs: docs.map((x, i) => i === currentIndex ? doc : x)
        })
    }

    updateDocs = ({docs}) => {
        this.setState({docs})
    }

    updateCurrentIndex = ({currentIndex}) => {
        this.setState({currentIndex})
    }

    render() {
        let doc = this.getCurrentDoc()

        return <DocumentView
            doc={doc}
            selectedIds={[0]}
            onChange={this.updateDoc}
        />
    }
}
