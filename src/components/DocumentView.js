import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'
import OutlineView from './OutlineView'

class DocumentViewHeader extends Component {
    state = {
        progress: null
    }

    componentWillReceiveProps(nextProps) {
        let {doc} = this.props

        clearTimeout(this.updateProgressId)

        this.updateProgressId = setTimeout(() => {
            if (this.state.progress != null && doc.list === this.props.doc.list) return

            let {progress} = outline.getStats(this.props.doc.list)
            this.setState({progress: Math.round(progress * 100)})
        }, 500)
    }

    componentDidMount() {
        this.componentWillReceiveProps(this.props)
    }

    handleInput = evt => {
        let {onChange = () => {}} = this.props
        let {value} = evt.currentTarget

        onChange({title: value})
    }

    render() {
        let {progress} = this.state
        let {doc} = this.props

        return <div class="document-view-header">
            <div class="progress" style={{width: `${progress}%`}}/>

            <h1><input value={doc.title} onInput={this.handleInput}/></h1>
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
            <DocumentViewHeader
                doc={doc}
                onChange={this.handleChange}
            />

            <OutlineView
                list={doc.list}
                selectedIds={selectedIds}

                onChange={this.handleChange}
                onSelectionChange={this.props.onSelectionChange}
            />
        </section>
    }
}
