import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'

class OutlineItem extends Component {
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
        onChange({id: this.props.id, collapsed: !collapsed})
    }

    handleSublistChange = ({list}) => {
        let {id, onChange = () => {}} = this.props
        onChange({id: this.props.id, sublist: list})
    }

    render() {
        let {level, showCollapse, selectedIds, id, collapsed, checked, sublist, text} = this.props

        return <li
            data-id={id}
            class={classnames('outline-item', {
                collapsed,
                showcollapse: showCollapse,
                checked,
                selected: selectedIds.includes(id),
                parent: sublist.length > 0
            })}
        >
            <div 
                class="inner" 
                style={{paddingLeft: `${level * 1.5 + 1}rem`}}
                onClick={this.handleClick}
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

                <span class="id">#{id}</span>{' '}
                <span class="text">{checked ? <del>{text}</del> : text}</span>
            </div>

            {!collapsed &&
                <OutlineList
                    list={sublist}
                    level={level + 1}
                    showCollapse={showCollapse}
                    selectedIds={selectedIds}

                    onItemClick={this.handleSubitemClick}
                    onChange={this.handleSublistChange}
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
        let {list, level, showCollapse, selectedIds} = this.props

        if (list.length === 0) return

        return <ul class="outline-list">
            {list.map(({id, collapsed, checked, text, sublist}) =>
                <OutlineItem
                    key={id}
                    level={level}
                    showCollapse={showCollapse}
                    selectedIds={selectedIds}
                    id={id}
                    collapsed={collapsed}
                    checked={checked}
                    text={text}
                    sublist={sublist}

                    onClick={this.props.onItemClick}
                    onChange={this.updateItem}
                />
            )}
        </ul>
    }
}
