import {h, Component} from 'preact'
import classnames from 'classnames'
import OutlineView from './OutlineView'

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
        let {doc, selectedIds, onSelectionChange = () => {}} = this.props

        return <section class="document-view">
            <DocumentViewHeader doc={doc} />

            <OutlineView
                list={doc.list}
                selectedIds={selectedIds}

                onChange={this.handleChange}
                onSelectionChange={onSelectionChange}
            />
        </section>
    }
}
