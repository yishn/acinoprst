import {h, Component} from 'preact'
import {reformat} from '../outline'

import Textarea from './Textarea'

export default class Outliner extends Component {
    render() {
        return <section id="outliner">
            <Textarea
                value={this.props.content}
                onChange={this.props.onChange}
            />
        </section>
    }
}
