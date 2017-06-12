import {h, Component} from 'preact'
import {reformat} from '../outline'

import CodeTextarea from './CodeTextarea'

export default class Outliner extends Component {
    render() {
        return <section id="outliner">
            <CodeTextarea
                value={this.props.content}
                onChange={this.props.onChange}
            />
        </section>
    }
}
