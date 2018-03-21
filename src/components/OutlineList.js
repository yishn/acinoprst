import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'
import InlineMarkdown from './InlineMarkdown'

const SpanDel = ({children}) => <span><del>{children}</del></span>

class OutlineItem extends Component {
    componentDidUpdate(prevProps) {
        let {id, editId, text} = this.props

        if (editId === id && this.inputElement != null && document.activeElement !== this.inputElement) {
            this.inputElement.focus()
            this.inputElement.select()
        }
    }

    componentDidMount() {
        this.componentDidUpdate(this.props)
    }

    handleClick = evt => {
        let {id, onClick = () => {}} = this.props
        onClick({id, mouseEvent: evt})
    }

    handleDoubleClick = evt => {
        let {id, onDoubleClick = () => {}} = this.props
        onDoubleClick({id, mouseEvent: evt})
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

        if ([8, 46].includes(evt.keyCode) && evt.currentTarget.value === '') {
            // Backspace, Delete

            evt.preventDefault()
            this.inputElement.blur()
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

                <div class="text" onDblClick={this.handleDoubleClick}>
                    {edit || text === '' ? (
                        <span style={{visibility: 'hidden'}}>{text !== '' ? text : '_'}</span>
                    ) : (
                        <InlineMarkdown
                            source={text}
                            renderers={{root: checked ? SpanDel : 'span'}}
                        />
                    )}

                    <textarea
                        ref={el => this.inputElement = el}
                        tabIndex={edit ? 0 : -1}
                        value={text}

                        onInput={this.handleInput}
                        onKeyDown={this.handleInputKeyDown}
                        onBlur={this.handleCancelEdit}
                    />
                </div>
            </div>

            {!collapsed &&
                <OutlineList
                    list={sublist}
                    level={level + 1}
                    showCollapse={showCollapse}
                    selectedIds={selectedIds}
                    editId={editId}

                    onItemClick={this.props.onClick}
                    onItemDoubleClick={this.props.onDoubleClick}
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
                    onDoubleClick={this.props.onItemDoubleClick}
                    onChange={this.updateItem}
                    onCancelEdit={this.props.onCancelEdit}
                />
            )}
        </ul>
    }
}
