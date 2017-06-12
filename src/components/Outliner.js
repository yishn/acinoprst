import {h, Component} from 'preact'
import {reformat} from '../outline'

export default class Outliner extends Component {
    render() {
        return <section id="outliner">
            <textarea>{reformat(this.props.content)}</textarea>
        </section>
    }
}
