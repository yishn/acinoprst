import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'

export default class OutlineList extends Component {
    updateItem = ({id, data}) => {
        let {list, onChange = () => {}} = this.props

        onChange({list: outline.update(list, id, data)})
    }

    handleToggleCollapse = evt => {
        let {list} = this.props
        let id = +evt.currentTarget.dataset.id
        let item = list.find(item => item.id === id)

        this.updateItem({id, data: {collapsed: !item.collapsed}})
    }

    render() {
        let {list, level, selectedIds} = this.props

        if (list.length === 0) return

        return <ul class="outline-list">
            {list.map(({id, collapsed, checked, text, sublist}) =>
                <li
                    key={id}
                    data-id={id}
                    class={classnames('outline-item', {
                        collapsed,
                        checked,
                        selected: selectedIds.includes(id),
                        parent: sublist.length > 0
                    })}
                >
                    <div class="inner" style={{paddingLeft: `${level * 1.5 + 1}rem`}}>
                        <span 
                            data-id={id}
                            class="collapse" 
                            href="#" 
                            title={collapsed ? 'Expand' : 'Collapse'}
                            onClick={this.handleToggleCollapse}
                        >
                            <img
                                width="12"
                                height="12"
                                src="./img/arrow.svg"
                                alt={collapsed ? 'Collapsed' : 'Expanded'}
                            />
                        </span>{' '}

                        <span class="id">#{id}</span>{' '}
                        <span class="text">{checked ? <del>{text}</del> : text}</span>
                    </div>

                    {!collapsed &&
                        <OutlineList
                            list={sublist}
                            level={level + 1}
                            selectedIds={selectedIds}
                        />
                    }
                </li>
            )}
        </ul>
    }
}
