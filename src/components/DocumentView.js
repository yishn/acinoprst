import {h, Component} from 'preact'
import classnames from 'classnames'
import OutlineList from './OutlineList'

class DocumentViewHeader extends Component {
    render() {
        let {doc} = this.props

        return <div class="document-view-header">
            <h1>{doc.title}</h1>
        </div>
    }
}

export default class DocumentView extends Component {
    handleChange = evt => {
        let {doc, onChange = () => {}} = this.props

        onChange({doc: {...doc, ...evt}})
    }

    render() {
        let {doc, selectedIds} = this.props

        return <section class="document-view">
            <DocumentViewHeader doc={doc} />

            <div class="list">
                <OutlineList 
                    list={doc.list}
                    level={0}
                    selectedIds={selectedIds}
                    onChange={this.handleChange}
                />
            </div>
        </section>
    }
}
