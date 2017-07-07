import {h, Component} from 'preact'
import {extractStats} from '../outline'
import classNames from 'classnames'

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
        return <li class={this.props.type}>
            {
                this.props.type !== 'separator' &&

                <a href="#" onClick={this.handleClick}>{this.props.children}</a>
            }
        </li>
    }
}

export class ToolbarButton extends Component {
    constructor() {
        super()

        this.state = {
            menuOpen: false
        }
    }

    handleClick = evt => {
        evt.preventDefault()

        if (this.props.disabled) return

        if (this.props.children.length > 0) {
            // Open menu

            this.setState({menuOpen: true})
        }

        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    handleMenuClick = () => {
        this.setState({menuOpen: false})
    }

    render() {
        let id = this.props.text.toLowerCase().replace(/\s+/g, '-')

        return <li
            class={classNames(id, {
                open: this.state.menuOpen,
                disabled: this.props.disabled
            })}
        >
            <a href="#" title={this.props.text} onClick={this.handleClick}>
                <img
                    src={`./node_modules/octicons/build/svg/${this.props.icon}.svg`}
                    alt={this.props.text}
                />
            </a>

            {
                this.props.children.length > 0 &&

                <ul class="menu" onClick={this.handleMenuClick}>
                    <li class="overlay" />
                    {this.props.children}
                </ul>
            }
        </li>
    }
}

export default class Headline extends Component {
    constructor(props) {
        super(props)

        this.state = {
            progress: 0
        }

        this.componentWillReceiveProps(props)
    }

    componentWillReceiveProps() {
        clearTimeout(this.stateUpdateId)

        this.stateUpdateId = setTimeout(() => {
            this.setState({
                progress: extractStats(this.props.content).progress
            })
        }, 500)
    }

    handleInputChange = evt => {
        let {onChange = () => {}} = this.props
        onChange({value: evt.currentTarget.value})
    }

    render() {
        let percent = Math.round(this.state.progress * 100)

        return <section id="headline">
            <div
                class="progress"
                style={{width: `${percent}%`}}
            />

            <span class="hash">#</span>

            <input
                type="text"
                value={this.props.value}
                placeholder="(Untitled)"
                title={`${percent}% done`}

                onInput={this.handleInputChange}
            />

            <ul class="toolbar">
                {this.props.children}
            </ul>
        </section>
    }
}
