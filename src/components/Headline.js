import {h, Component} from 'preact'
import {extractStats} from '../outline'

import Menu from './Menu'

export default class Headline extends Component {
    constructor(props) {
        super(props)

        this.state = {
            progress: 0
        }

        this.componentWillReceiveProps(props)
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.value !== nextProps.value
            || this.state.progress !== nextState.progress
            || this.state.children !== nextState.children
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

            <Menu text="File Actions">
                {this.props.children}
            </Menu>
        </section>
    }
}
