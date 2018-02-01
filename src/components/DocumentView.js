import {h, Component} from 'preact'
import OutlineList from './OutlineList'

export default class DocumentView extends Component {
    render() {
        return <section class="document-view">
            <h1 class="title">{this.props.doc.title}</h1>

            <OutlineList list={this.props.doc.list}/>
        </section>
    }
}
