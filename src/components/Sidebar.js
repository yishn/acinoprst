import {h, Component} from 'preact'
import classNames from 'classnames'

export default class Sidebar extends Component {
    constructor() {
        super()

        this.handleResizerMouseDown = evt => {
            if (evt.button !== 0) return

            this.mouseDown = {x: evt.clientX, width: this.props.width}
        }

        this.handleItemClick = evt => {
            evt.preventDefault()

            let {onSelectionChange = () => {}} = this.props
            let {index} = evt.currentTarget.parentNode.dataset

            onSelectionChange({selected: +index})
        }
    }

    componentDidMount() {
        document.addEventListener('mouseup', evt => {
            this.mouseDown = null
        })

        document.addEventListener('mousemove', evt => {
            if (this.mouseDown == null) return

            let {onWidthChange = () => {}} = this.props
            let {x, width} = this.mouseDown
            let {clientX} = evt

            if (document.activeElement != null) document.activeElement.blur()

            onWidthChange({width: Math.max(width + clientX - x, 100)})
        })
    }

    render() {
        return <section id="sidebar" style={{width: this.props.width}}>
            <nav>
                <h3>Files</h3>

                <ul>
                {this.props.items.map((name, i) =>
                    <li data-index={i} class={classNames({selected: this.props.selected === i})}>
                        <a href="#" onClick={this.handleItemClick}>
                            <img src="./node_modules/octicons/build/svg/file.svg" />
                            {name}
                        </a>
                    </li>
                )}
                </ul>
            </nav>

            <div
                class="resizer"
                onMouseDown={this.handleResizerMouseDown}
            />
        </section>
    }
}
