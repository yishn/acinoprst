import {h, Component} from 'preact'
import classnames from 'classnames'

export default class OutlineList extends Component {
    render() {
        let {list, level, selectedId} = this.props

        if (list.length === 0) return

        return <ul class="outline-list">
            {list.map(({id, collapsed, checked, text, sublist}) =>
                <li
                    data-id={id}
                    class={classnames('outline-item', {
                        collapsed,
                        checked,
                        selected: id === selectedId,
                        parent: sublist.length > 0
                    })}
                >
                    <div class="inner" style={{paddingLeft: `${level * 1.5 + 1}rem`}}>
                        <a class="collapse" href="#" title={collapsed ? 'Expand' : 'Collapse'}>
                            <img
                                width="16"
                                height="16"
                                src="./img/arrow.svg"
                                alt={collapsed ? 'Expand' : 'Collapse'}
                            />
                        </a>{' '}

                        <span class="id">#{id}</span>{' '}
                        <span class="text">{checked ? <del>{text}</del> : text}</span>
                    </div>

                    {!collapsed &&
                        <OutlineList
                            list={sublist}
                            level={level + 1}
                            selectedId={selectedId}
                        />
                    }
                </li>
            )}
        </ul>
    }
}
