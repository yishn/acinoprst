import {h, Component} from 'preact'
import classNames from 'classnames'

function cap(min, max, value) {
    return Math.min(max, Math.max(min, value))
}

export class SidebarButton extends Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.text !== this.props.text
            || nextProps.icon !== this.props.icon
            || nextProps.onClick !== this.props.onClick
    }

    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    render() {
        return <a href="#" title={this.props.text} onClick={this.handleClick}>
            <img src={`./node_modules/octicons/build/svg/${this.props.icon}.svg`} />
        </a>
    }
}

export default class Sidebar extends Component {
    constructor() {
        super()

        this.state = {
            dragging: false,
            dragIndex: 0,
            dragBefore: 0,
            dragGhostTop: 0
        }
    }

    componentDidMount() {
        document.addEventListener('mouseup', evt => {
            if (this.itemMouseDown != null && this.state.dragging) {
                let {onOrderChange = () => {}} = this.props

                let permutation = this.props.items.map((_, i) => i)
                let [dragItem] = permutation.splice(this.state.dragIndex, 1)
                permutation.splice(this.state.dragBefore, 0, dragItem)

                this.setState({dragging: false})
                onOrderChange({permutation})
            }

            this.resizerMouseDown = null
            this.itemMouseDown = null
        })

        document.addEventListener('mousemove', evt => {
            if (this.resizerMouseDown != null) {
                evt.preventDefault()

                let {onWidthChange = () => {}} = this.props
                let {x, width} = this.resizerMouseDown
                let {clientX} = evt

                onWidthChange({width: width + clientX - x})
            } else if (this.itemMouseDown != null) {
                evt.preventDefault()

                this.itemDragged = true

                let {diff, itemHeight, top, bottom} = this.itemMouseDown
                let pivot = evt.clientY + this.scrollElement.scrollTop
                let dragBefore = Math.floor((pivot - top) / itemHeight)

                this.setState({
                    dragging: true,
                    dragIndex: this.itemMouseDown.index,
                    dragBefore: cap(0, this.props.items.length - 1, dragBefore),
                    dragGhostTop: cap(top, bottom - itemHeight, pivot - diff)
                })
            }
        })
    }

    handleResizerMouseDown = evt => {
        if (evt.button !== 0) return

        this.resizerMouseDown = {
            x: evt.clientX,
            width: this.props.width
        }
    }

    handleItemMouseDown = evt => {
        if (evt.button !== 0) return

        let {currentTarget} = evt
        let ulElement = currentTarget.parentNode.parentNode
        let {top: itemTop, height: itemHeight} = currentTarget.getBoundingClientRect()
        let {top, bottom} = ulElement.getBoundingClientRect()

        this.itemDragged = false
        this.itemMouseDown = {
            index: +currentTarget.parentNode.dataset.index,
            diff: evt.clientY - itemTop,
            top: top + this.scrollElement.scrollTop,
            bottom: bottom + this.scrollElement.scrollTop,
            itemHeight
        }
    }

    handleItemClick = evt => {
        evt.preventDefault()

        if (this.itemDragged) return

        let {onSelectionChange = () => {}} = this.props
        let {index} = evt.currentTarget.parentNode.dataset

        onSelectionChange({...evt, selected: +index})
    }

    render() {
        let items = this.props.items.map((x, i) => [i, x])

        if (this.state.dragging) {
            let [dragItem] = items.splice(this.state.dragIndex, 1)
            items.splice(this.state.dragBefore, 0, dragItem)
        }

        return <section id="sidebar" style={{width: this.props.width}}>
            <nav ref={el => this.scrollElement = el}>
                <h3>
                    Files

                    {this.props.visible && <span class="actions">
                        {this.props.children}
                    </span>}
                </h3>

                {this.props.visible && <ul class={classNames({dragging: this.state.dragging})}>
                    {items.map(([i, name]) =>
                        <li
                            key={i}
                            data-index={i}
                            class={classNames({
                                selected: this.props.selected === i,
                                dragging: this.state.dragging && this.state.dragIndex === i
                            })}
                        >
                            <a
                                href="#"
                                onClick={this.handleItemClick}
                                onMouseDown={this.handleItemMouseDown}
                            >
                                <img src="./node_modules/octicons/build/svg/file.svg" />
                                {name || '(Untitled)'}
                            </a>
                        </li>
                    )}

                    {this.state.dragging &&
                        <li
                            key="ghost"
                            style={{top: this.state.dragGhostTop}}
                            class={classNames({
                                ghost: true,
                                selected: this.props.selected === this.state.dragIndex
                            })}
                        >
                            <a href="#">
                                <img src="./node_modules/octicons/build/svg/file.svg" />
                                {this.props.items[this.state.dragIndex] || '(Untitled)'}
                            </a>
                        </li>
                    }
                </ul>}
            </nav>

            <div
                class="resizer"
                onMouseDown={this.handleResizerMouseDown}
            />
        </section>
    }
}
