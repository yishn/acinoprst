import {h, Component} from 'preact'
import classnames from 'classnames'

export default class OutlineList extends Component {
    render() {
        if (this.props.list == null) return

        return <ul class="outline-list">
            {this.props.list.map(({id, collapsed, checked, text, sublist}) =>
                <li class={classnames('outline-item', {collapsed, checked})}>
                    <span class="id">#{id}</span>{' '}
                    <span class="text">{checked ? <del>{text}</del> : text}</span>
                    <OutlineList list={sublist} />
                </li>
            )}
        </ul>
    }
}
