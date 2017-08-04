import {h, Component} from 'preact'
import classNames from 'classnames'

import * as github from '../github'

function cap(min, max, value) {
    return Math.min(max, Math.max(min, value))
}

export class SidebarButton extends Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.text !== this.props.text
            || nextProps.icon !== this.props.icon
            || nextProps.sync !== this.props.sync
            || nextProps.onClick !== this.props.onClick
    }

    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    render() {
        let icon = this.props.sync ? 'sync' : this.props.icon

        return <a
            class={classNames({sync: this.props.sync})}
            href="#"
            title={this.props.text}
            onClick={this.handleClick}
        >
            <img src={`./node_modules/octicons/build/svg/${icon}.svg`} />
        </a>
    }
}

export default class Sidebar extends Component {
    constructor() {
        super()

        this.state = {
            avatar: null,
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

                let {diff, itemHeight, posDiff, top, bottom} = this.itemMouseDown
                let pivot = evt.clientY + this.scrollElement.scrollTop - posDiff
                let dragBefore = Math.floor((pivot - top) / itemHeight)

                this.setState({
                    dragging: true,
                    dragIndex: this.itemMouseDown.index,
                    dragBefore: cap(0, this.props.items.length - 1, dragBefore),
                    dragGhostTop: cap(top, bottom - itemHeight, pivot - diff)
                })
            }
        })

        this.updateAvatar()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.username !== this.props.username) {
            this.updateAvatar()
        }
    }

    async updateAvatar() {
        if (this.props.username == null) return

        this.setState({avatar: null})

        try {
            let user = await github.getUser()
            this.setState({avatar: user.avatar_url})
        } catch (err) {}
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
        let {top: posDiff} = this.scrollElement.getBoundingClientRect()
        let {top, bottom} = ulElement.getBoundingClientRect()

        this.itemDragged = false
        this.itemMouseDown = {
            index: +currentTarget.parentNode.dataset.index,
            diff: evt.clientY - itemTop,
            posDiff,
            top: top + this.scrollElement.scrollTop - posDiff,
            bottom: bottom + this.scrollElement.scrollTop - posDiff,
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
            <div class="head">
                <div class="avatar" style={{backgroundImage: `url('${this.state.avatar}')`}}/>

                <span>{this.props.username}</span>
            </div>

            <nav ref={el => this.scrollElement = el}>
                <h3>
                    Outlines

                    {this.props.visible &&
                        <span class="actions">
                            {this.props.children}
                        </span>
                    }
                </h3>

                {this.props.visible &&
                    <ul class={classNames({dragging: this.state.dragging})}>
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
                    </ul>
                }
            </nav>

            <div
                class="resizer"
                onMouseDown={this.handleResizerMouseDown}
            />
        </section>
    }
}
