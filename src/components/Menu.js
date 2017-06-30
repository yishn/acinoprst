import {h, Component} from 'preact'
import classNames from 'classnames'

export default class Menu extends Component {
    constructor() {
        super()

        this.state = {
            open: false
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.children !== this.props.children
            || nextProps.text !== this.props.text
            || nextState.open !== this.state.open
    }

    handleClick = evt => {
        evt.preventDefault()

        this.setState({open: true})
    }

    handleOverlayClick = evt => {
        this.setState({open: false})
    }

    render() {
        return <section class={classNames('menu', {open: this.state.open})}>
            <h2>
                <a href="#" title={this.props.text} onClick={this.handleClick}>
                    {this.props.text}
                </a>
            </h2>

            <div class="overlay" onClick={this.handleOverlayClick}></div>

            <ul onClick={this.handleOverlayClick}>
                {this.props.children}
            </ul>
        </section>
    }
}

export class MenuItem extends Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.onClick !== this.props.onClick
            || nextProps.text !== this.props.text
            || nextProps.type !== this.props.type
    }

    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    render() {
        return <li class={this.props.type}>{
            this.props.type !== 'separator'
            && <a href="#" onClick={this.handleClick}>{this.props.children}</a>
        }</li>
    }
}
