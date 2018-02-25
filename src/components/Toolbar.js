import {h, Component} from 'preact'
import classnames from 'classnames'

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
                {icon != null && <img src={icon} alt={text}/>}{' '}
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

export default class Toolbar extends Component {
    render() {
        let {disabled} = this.props

        return <section class="tool-bar">
            <ul class={classnames('buttons', {disabled})}>
                {this.props.children}
            </ul>
        </section>
    }
}
