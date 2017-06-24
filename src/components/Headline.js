import {h, Component} from 'preact'
import * as outline from '../outline'

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
    }

    componentWillReceiveProps() {
        clearTimeout(this.stateUpdateId)
        this.stateUpdateId = setTimeout(() => {
            this.setState({
                progress: outline.extractStats(this.props.content).progress
            })
        }, 500)
    }

    handleInputChange = evt => {
        let {onChange = () => {}} = this.props
        onChange({value: evt.currentTarget.value})
    }

    render() {
        let percent = Math.round(this.state.progress * 100)

        return <section id="headline" title={`${percent}% done`}>
            <div
                class="progress"
                style={{width: `${percent}%`}}
            />

            <span class="hash">#</span>

            <input
                type="text"
                value={this.props.value}
                placeholder="(Untitled)"

                onInput={this.handleInputChange}
            />
        </section>
    }
}
