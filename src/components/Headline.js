const {h, Component} = require('preact')

export default class Headline extends Component {
    constructor() {
        super()

        this.handleInputChange = evt => {
            let {onChange = () => {}} = this.props
            onChange({value: evt.currentTarget.value})
        }
    }

    shouldComponentUpdate(nextProps) {
        return this.props.value !== nextProps.value
            || this.props.content !== nextProps.content
    }

    render() {
        return <section id="headline">
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
