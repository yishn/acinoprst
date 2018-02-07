import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'
import OutlineView from './OutlineView'

class DocumentViewHeader extends Component {
    state = {
        progress: 0
    }

    componentWillReceiveProps(nextProps) {
        let {doc} = this.props

        clearTimeout(this.updateProgressId)

        this.updateProgressId = setTimeout(() => {
            if (doc.list === this.props.doc.list) return

            let {progress} = outline.getStats(this.props.doc.list)
            this.setState({progress: Math.round(progress * 100)})
        }, 500)
    }

    render() {
        let {progress} = this.state
        let {doc} = this.props

        return <div class="document-view-header">
            <div class="progress" style={{width: `${progress}%`}}/>

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

            <OutlineView
                list={doc.list}
                selectedIds={selectedIds}

                onChange={this.handleChange}
                onSelectionChange={this.props.onSelectionChange}
            />
        </section>
    }
}
