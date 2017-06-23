import {h, Component} from 'preact'
import classNames from 'classnames'

function cap(min, max, value) {
    return Math.min(max, Math.max(min, value))
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

        this.handleResizerMouseDown = evt => {
            if (evt.button !== 0) return

            this.resizerMouseDown = {
                x: evt.clientX,
                width: this.props.width
            }
        }

        this.handleItemMouseDown = evt => {
            if (evt.button !== 0) return

            let {currentTarget} = evt
            let ulElement = currentTarget.parentNode.parentNode
            let {top: itemTop, height: itemHeight} = currentTarget.getBoundingClientRect()
            let {top, bottom} = ulElement.getBoundingClientRect()

            this.itemDragged = false
            this.itemMouseDown = {
                index: +currentTarget.parentNode.dataset.index,
                diff: evt.clientY - itemTop,
                itemHeight,
                top,
                bottom
            }
        }

        this.handleItemClick = evt => {
            evt.preventDefault()

            if (this.itemDragged) return

            let {onSelectionChange = () => {}} = this.props
            let {index} = evt.currentTarget.parentNode.dataset

            onSelectionChange({selected: +index})
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

                onWidthChange({width: Math.max(width + clientX - x, 100)})
            } else if (this.itemMouseDown != null) {
                evt.preventDefault()

                this.itemDragged = true

                let {diff, itemHeight, top, bottom} = this.itemMouseDown
                let dragBefore = Math.floor((evt.clientY - top) / itemHeight)

                this.setState({
                    dragging: true,
                    dragIndex: this.itemMouseDown.index,
                    dragBefore: cap(0, this.props.items.length - 1, dragBefore),
                    dragGhostTop: cap(top, bottom - itemHeight, evt.clientY - diff)
                })
            }
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.width !== nextProps.width
            || this.props.items !== nextProps.items
            || this.props.selected !== nextProps.selected
            || this.state.dragging !== nextState.dragging
            || this.state.dragIndex !== nextState.dragIndex
            || this.state.dragBefore !== nextState.dragBefore
            || this.state.dragGhostTop !== nextState.dragGhostTop
    }

    render() {
        let items = this.props.items.map((x, i) => [i, x])

        if (this.state.dragging) {
            let [dragItem] = items.splice(this.state.dragIndex, 1)
            items.splice(this.state.dragBefore, 0, dragItem)
        }

        return <section id="sidebar" style={{width: this.props.width}}>
            <nav>
                <h3>
                    Files

                    <span class="actions">
                        <a href="#" title="New File" onClick={this.props.onNewFileClick}>
                            <img src="./node_modules/octicons/build/svg/plus.svg" />
                        </a>

                        <a href="#" title="Remove File" onClick={this.props.onRemoveFileClick}>
                            <img src="./node_modules/octicons/build/svg/trashcan.svg" />
                        </a>
                    </span>
                </h3>

                <ul class={classNames({dragging: this.state.dragging})}>
                {items.map(([i, name]) =>
                    <li key={i} data-index={i} class={classNames({
                        selected: this.props.selected === i,
                        dragging: this.state.dragging && this.state.dragIndex === i
                    })}>
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
                </ul>
            </nav>

            <div
                class="resizer"
                onMouseDown={this.handleResizerMouseDown}
            />
        </section>
    }
}