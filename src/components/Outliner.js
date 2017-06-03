import {h, Component} from 'preact'

export default class Outliner extends Component {
    render() {
        return <section id="outliner">
            <pre>{this.props.content}</pre>
        </section>
    }
}
