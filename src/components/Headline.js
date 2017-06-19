import {h, Component} from 'preact'
import * as outline from '../outline'

export default class Headline extends Component {
    constructor(props) {
        super(props)

        this.state = {
            progress: 0
        }

        this.handleInputChange = evt => {
            let {onChange = () => {}} = this.props
            onChange({value: evt.currentTarget.value})
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

    render() {
        let progress = Math.round(this.state.progress * 100)

        return <section id="headline">
            <div class="progress" style={{width: `${progress}%`}} />

            <span class="hash">#</span>

            <input
                type="text"
                value={this.props.value}
                placeholder="Title"

                onInput={this.handleInputChange}
            />
        </section>
    }
}
