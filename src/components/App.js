import {h, Component} from 'preact'
import * as outline from '../outline'
import * as doclist from '../doclist'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            currentIndex: -1,
            docs: doclist.append(
                doclist.append([], 'Test', outline.parse([
                    '- [ ] Hello',
                    '    - [x] World',
                    '- [x] Hey',
                    '+ [ ] What is up',
                    '    - [ ] Boom'
                ].join('\n'))),
                'Test2', outline.parse([
                    '- [ ] Hello',
                    '    - [x] World',
                    '- [x] Hey',
                    '+ [ ] What is up',
                    '    - [ ] Boom'
                ].join('\n'))
            )
        }
    }

    getCurrentDoc = () => {
        let {docs, currentIndex} = this.state
        return docs[currentIndex]
    }

    updateDocs = ({docs}) => {
        this.setState({docs})
    }

    updateCurrentIndex = ({currentIndex}) => {
        this.setState({currentIndex})
    }

    render() {
        let doc = this.getCurrentDoc()

        return <pre>{doclist.stringify(this.state.docs)}</pre>
    }
}
