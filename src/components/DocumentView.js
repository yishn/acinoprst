import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'
import OutlineView from './OutlineView'
import History from '../history'

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

    handleKeyDown = evt => {
        if (evt.keyCode === 13) {
            // Enter

            evt.preventDefault()

            let {onSubmit = () => {}} = this.props
            onSubmit()
        }
    }

    render() {
        let {progress} = this.state
        let {doc} = this.props

        return <div class="document-view-header">
            <div class="progress" style={{width: `${progress}%`}}/>

            <h1 title={`${progress}%`}>
                <input
                    value={doc.title}

                    onKeyDown={this.handleKeyDown}
                    onInput={this.handleInput}
                />
            </h1>
        </div>
    }
}

export default class DocumentView extends Component {
    history = new History()

    componentWillReceiveProps(nextProps) {
        if (nextProps.doc !== this.props.doc) {
            let {doc, selectedIds} = nextProps
            this.history.push({doc, selectedIds})
        }
    }

    handleOutlineBlur = () => {
        let titleInput = this.element.querySelector('.document-view-header h1 input')
        
        titleInput.select()
        titleInput.focus()
    }

    handleTitleSubmit = () => {
        this.element.querySelector('.outline-view').focus()
    }

    handleChange = evt => {
        let {doc, onChange = () => {}} = this.props
        onChange({doc: {...doc, ...evt}})
    }

    handleHistoryStep = step => {
        let {onChange = () => {}, onSelectionChange = () => {}} = this.props
        let entry = history.step(step)
        if (entry == null) return

        onChange({doc: entry.doc})
        onSelectionChange({selectedIds: entry.selectedIds})
    }

    handleUndo = () => this.handleHistoryStep(-1)
    handleRedo = () => this.handleHistoryStep(1)

    render() {
        let {doc, selectedIds} = this.props

        return <section ref={el => this.element = el} class="document-view">
            <DocumentViewHeader
                doc={doc}

                onSubmit={this.handleTitleSubmit}
                onChange={this.handleChange}
            />

            <OutlineView
                list={doc.list}
                selectedIds={selectedIds}

                onBlur={this.handleOutlineBlur}
                onChange={this.handleChange}
                onSelectionChange={this.props.onSelectionChange}
            />
        </section>
    }
}
