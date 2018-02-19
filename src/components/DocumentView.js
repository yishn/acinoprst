import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'
import OutlineView from './OutlineView'

export class ToolbarButton extends Component {
    handleClick = evt => {
        evt.preventDefault()

        let {disabled, onClick = () => {}} = this.props
        if (disabled) return

        onClick(evt)
    }

    render() {
        let {disabled, icon, tooltip, text} = this.props

        return <li class={classnames({disabled})}>
            <a href="#" title={tooltip || text} onClick={this.handleClick}>
                <img src={icon} alt={text}/>{' '}
                <span class="text">{text}</span>
            </a>
        </li>
    }
}

export class ToolbarSeparator extends Component {
    render() {
        return <li class="separator"/>
    }
}

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
        let {disabled, doc} = this.props

        return <div class={classnames('document-view-header', {disabled})}>
            <div class="progress" style={{transform: `translateX(${progress - 100}%)`}}/>

            <ul class="buttons">
                <ToolbarButton text="Menu" icon="./img/menu.svg" onClick={this.props.onMenuButtonClick}/>
            </ul>

            <h1 title={`${progress}%`}>
                <input
                    disabled={disabled}
                    value={doc.title}
                    placeholder={disabled ? '' : '(Untitled)'}

                    onKeyDown={this.handleKeyDown}
                    onInput={this.handleInput}
                />
            </h1>

            <ul class={classnames('buttons', {disabled})}>
                {this.props.buttons}
            </ul>
        </div>
    }
}

class DocumentViewToolbar extends Component {
    render() {
        let {disabled} = this.props

        return <div class="document-view-toolbar">
            <ul class={classnames('buttons', {disabled})}>
                {this.props.children}
            </ul>
        </div>
    }
}

export default class DocumentView extends Component {
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

    handleSeparateItems = evt => {
        let {doc, onChange = () => {}} = this.props
        onChange({doc: {...doc, list: outline.separateItems(doc.list)}})
    }

    removeCheckedTasks = evt => {
        let {doc, onChange = () => {}} = this.props
        onChange({doc: {...doc, list: outline.removeCheckedTasks(doc.list)}})
    }

    render() {
        let {disabled, doc, selectedIds} = this.props

        return <section ref={el => this.element = el} class="document-view">
            <DocumentViewHeader
                disabled={disabled}
                doc={doc}
                buttons={[
                    <ToolbarButton
                        icon="./img/trash.svg"
                        text="Remove"
                        onClick={this.props.onRemove}
                    />
                ]}

                onMenuButtonClick={this.props.onMenuButtonClick}
                onSubmit={this.handleTitleSubmit}
                onChange={this.handleChange}
            />

            <DocumentViewToolbar disabled={disabled}>
                <ToolbarButton
                    icon="./img/undo.svg"
                    text="Undo"
                    onClick={this.props.onUndo}
                />
                <ToolbarButton
                    icon="./img/redo.svg"
                    text="Redo"
                    onClick={this.props.onRedo}
                />
                <ToolbarSeparator/>
                <ToolbarButton
                    icon="./img/separate-items.svg"
                    tooltip="Move checked items to the bottom"
                    text="Separate"
                    onClick={this.handleSeparateItems}
                />
                <ToolbarButton
                    icon="./img/remove-checked.svg"
                    tooltip="Remove all checked items"
                    text="Remove Checked"
                    onClick={this.removeCheckedTasks}
                />
            </DocumentViewToolbar>

            <OutlineView
                disabled={disabled}
                list={doc.list}
                selectedIds={selectedIds}

                onBlur={this.handleOutlineBlur}
                onChange={this.handleChange}
                onSelectionChange={this.props.onSelectionChange}
                onUndo={this.props.onUndo}
                onRedo={this.props.onRedo}
            />
        </section>
    }
}
