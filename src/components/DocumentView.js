import {h, Component} from 'preact'
import classnames from 'classnames'
import OutlineList from './OutlineList'

class DocumentViewHeader extends Component {
    render() {
        let {doc, selected} = this.props

        return <div class={classnames('document-view-header', {selected})}>
            <h1>{doc.title}</h1>
        </div>
    }
}

export default class DocumentView extends Component {
    render() {
        let {doc, selectedItem} = this.props

        return <section class="document-view">
            <DocumentViewHeader doc={doc} selected={selectedItem === 'title'} />

            <div class="list">
                <OutlineList list={doc.list} level={0} selectedId={selectedItem} />
            </div>
        </section>
    }
}
