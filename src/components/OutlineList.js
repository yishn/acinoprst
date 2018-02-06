import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'

class OutlineItem extends Component {
    state = {
        inputHeight: 0
    }

    componentDidUpdate(prevProps) {
        let {id, editId, text} = this.props

        if (editId === id) {
            if (this.inputElement != null && document.activeElement !== this.inputElement) {
                this.inputElement.focus()
                this.inputElement.select()
                this.updateInputHeight()
            }

            if (text !== prevProps.text) {
                this.updateInputHeight()
            }
        }
    }

    componentDidMount() {
        this.componentDidUpdate(this.props)
    }

    updateInputHeight() {
        if (this.textElement && this.inputElement) {
            let width = this.inputElement.clientWidth
            this.textElement.style.width = width + 'px'

            let inputHeight = this.textElement.offsetHeight
            this.textElement.style.width = null

            this.setState({inputHeight})
        }
    }

    handleClick = evt => {
        let {id, onClick = () => {}} = this.props
        onClick({id, mouseEvent: evt})
    }

    handleSubitemClick = evt => {
        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    handleToggleCollapse = () => {
        let {id, collapsed, onChange = () => {}} = this.props
        onChange({id, collapsed: !collapsed})
    }

    handleSublistChange = ({list}) => {
        let {id, onChange = () => {}} = this.props
        onChange({id, sublist: list})
    }

    handleInput = evt => {
        let {id, onChange = () => {}} = this.props
        onChange({id, text: evt.currentTarget.value})
    }

    handleInputKeyDown = evt => {
        if (evt.keyCode === 9 || evt.keyCode === 13 && evt.shiftKey) {
            // Tab, Shift+Enter

            evt.preventDefault()
            return
        }

        evt.stopPropagation()

        if ([27, 13].includes(evt.keyCode)) {
            // Esc, Enter
            this.inputElement.blur()
        }
    }

    handleCancelEdit = () => {
        let {id, editId, onCancelEdit = () => {}} = this.props
        if (editId === id) onCancelEdit()
    }

    render() {
        let {inputHeight} = this.state
        let {level, showCollapse, selectedIds, editId, id, collapsed, checked, sublist, text} = this.props
        let selected = selectedIds.includes(id)
        let edit = editId === id

        return <li
            data-id={id}
            class={classnames('outline-item', {
                collapsed,
                checked,
                showcollapse: showCollapse,
                edit,
                selected,
                parent: sublist.length > 0
            })}
        >
            <div
                class="inner"
                style={{paddingLeft: `${level * 1.5 + 1}rem`}}
                onMouseDown={this.handleClick}
            >
                {showCollapse &&
                    <span
                        data-id={id}
                        class="collapse"
                        title={collapsed ? 'Expand' : 'Collapse'}
                        onClick={this.handleToggleCollapse}
                    >
                        <img
                            width="12"
                            height="12"
                            src="./img/arrow.svg"
                            alt={collapsed ? 'Collapsed' : 'Expanded'}
                        />
                    </span>
                }{' '}

                <span ref={el => this.textElement = el} class="text">
                    {text !== ''
                        ? (checked ? <del>{text}</del> : text)
                        : <span style={{opacity: 0}}>_</span>
                    }
                </span>

                <textarea
                    ref={el => this.inputElement = el}
                    tabIndex={edit ? 0 : -1}
                    class="input"
                    style={{height: inputHeight}}
                    value={text}

                    onInput={this.handleInput}
                    onKeyDown={this.handleInputKeyDown}
                    onBlur={this.handleCancelEdit}
                />
            </div>

            {!collapsed &&
                <OutlineList
                    list={sublist}
                    level={level + 1}
                    showCollapse={showCollapse}
                    selectedIds={selectedIds}
                    editId={editId}

                    onItemClick={this.handleSubitemClick}
                    onChange={this.handleSublistChange}
                    onCancelEdit={this.props.onCancelEdit}
                />
            }
        </li>
    }
}

export default class OutlineList extends Component {
    updateItem = data => {
        let {list, onChange = () => {}} = this.props
        onChange({list: outline.update(list, data.id, data)})
    }

    render() {
        let {list, level, showCollapse, selectedIds, editId} = this.props

        if (list.length === 0) return

        return <ul class="outline-list">
            {list.map(({id, collapsed, checked, text, sublist}) =>
                <OutlineItem
                    key={id}
                    level={level}
                    showCollapse={showCollapse}
                    selectedIds={selectedIds}
                    editId={editId}
                    id={id}
                    collapsed={collapsed}
                    checked={checked}
                    text={text}
                    sublist={sublist}

                    onClick={this.props.onItemClick}
                    onChange={this.updateItem}
                    onCancelEdit={this.props.onCancelEdit}
                />
            )}
        </ul>
    }
}
