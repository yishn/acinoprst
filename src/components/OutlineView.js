import {h, Component} from 'preact'
import classnames from 'classnames'
import copyText from 'copy-text-to-clipboard'
import scrollIntoView from 'scroll-into-view-if-needed'
import * as outline from '../outline'
import OutlineList from './OutlineList'

const dedupe = arr => arr.sort((x, y) => x - y)
    .filter((x, i, arr) => i === 0 || arr[i - 1] !== x)

export default class OutlineView extends Component {
    state = {
        editId: null,
        focused: false,
        appendSelectionType: 0
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.selectedIds.length <= 1) {
            this.setState({appendSelectionType: 0})
        }
    }

    componentDidMount() {
        this.componentDidUpdate({})
    }

    componentDidUpdate(prevProps) {
        let {list, selectedIds} = this.props
        let listChange = prevProps.list !== list
        let selectedIdsChange = JSON.stringify(selectedIds) !== JSON.stringify(prevProps.selectedIds)

        if (listChange || selectedIdsChange) {
            let orderedSelectedIds = outline
                .getLinearItemTrails(list, {includeCollapsed: false})
                .filter(([item]) => selectedIds.includes(item.id))
                .map(([item]) => item.id)
            let edgeSelectedIndex = this.state.appendSelectionType > 0 ? orderedSelectedIds.length - 1 : 0
            let edgeSelectedId = orderedSelectedIds[edgeSelectedIndex]

            this.scrollIntoView(edgeSelectedId)
        }
    }

    gotFocus = () => this.setState({focused: true})
    lostFocus = () => this.setState({focused: false})

    scrollIntoView = id => {
        let element = this.element.querySelector(`.outline-item[data-id="${id}"] > .inner`)
        if (element != null) scrollIntoView(element)
    }

    startEdit = ({id}) => {
        let {onSelectionChange = () => {}} = this.props
        let {scrollTop} = this.element

        onSelectionChange({selectedIds: [id]})
        this.setState({editId: id}, () => {
            this.element.scrollTop = scrollTop
        })
    }

    cancelEdit = () => {
        let {scrollTop} = this.element
        this.element.focus()

        this.setState({editId: null}, () => {
            this.element.scrollTop = scrollTop
        })
    }

    getDescendantItemIds(ids, onlyCollapsed = false) {
        let {list} = this.props
        let result = [...ids]

        for (let id of ids) {
            let trail = outline.getItemTrail(list, id)
            if (trail.length === 0 || onlyCollapsed && !trail[0].collapsed) continue

            for (let subtrail of outline.getDescendantTrails(list, trail)) {
                if (subtrail.length === 0 || result.includes(subtrail[0].id)) continue
                result.push(subtrail[0].id)
            }
        }

        return result
    }

    removeItems = () => {
        let {list, selectedIds, onChange = () => {}, onSelectionChange = () => {}} = this.props

        let targetIds = this.getDescendantItemIds(selectedIds)
        let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
        let newSelectedIndex = linearItemTrails.findIndex(([item]) => targetIds.includes(item.id)) - 1
        if (newSelectedIndex < 0)
            newSelectedIndex = linearItemTrails.findIndex(([item]) => !targetIds.includes(item.id))
        let newSelectedIds = newSelectedIndex < 0 ? [] : [linearItemTrails[newSelectedIndex][0].id]

        let newList = selectedIds.reduce((list, id) => (
            outline.remove(list, id)
        ), list)

        onChange({list: newList})
        onSelectionChange({selectedIds: newSelectedIds})
    }

    handleItemClick = evt => {
        let {ctrlKey, shiftKey} = evt.mouseEvent
        let {list, selectedIds} = this.props
        let newSelectedIds = []

        if (shiftKey) {
            newSelectedIds = outline.getIdsBetween(list, [evt.id, ...selectedIds])
        } else if (ctrlKey) {
            if (selectedIds.includes(evt.id)) {
                newSelectedIds = selectedIds.filter(x => x !== evt.id)
            } else {
                newSelectedIds = [evt.id, ...selectedIds]
            }
        } else {
            newSelectedIds = [evt.id]
        }

        this.handleSelectionChange({selectedIds: newSelectedIds})
    }

    handleSelectionChange = ({selectedIds}) => {
        let {list, onSelectionChange = () => {}} = this.props

        // Normalize

        let newSelectedIds = dedupe([...selectedIds])
            .filter(id => outline.getItemTrail(list, id).length > 0)

        onSelectionChange({selectedIds: newSelectedIds})
    }

    handleKeyDown = evt => {
        let {list, selectedIds, onChange = () => {}, onSelectionChange = () => {}} = this.props

        if ([38, 40, 36, 35].includes(evt.keyCode) && !evt.ctrlKey) {
            // Arrow Up/Down, Home, End
            // Selection

            evt.preventDefault()

            let direction = [38, 36].includes(evt.keyCode) ? -1 : 1
            if (this.state.appendSelectionType === 0) this.setState({appendSelectionType: direction})

            let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
            if (linearItemTrails.length === 0) return

            let orderedSelectedIds = linearItemTrails
                .filter(([item]) => selectedIds.includes(item.id))
                .map(([item]) => item.id)
            let newSelectedIds = []

            let noneSelected = orderedSelectedIds.length === 0

            if ([36, 35].includes(evt.keyCode) || noneSelected) {
                let [edgeItem] = linearItemTrails[direction < 0 || noneSelected ? 0 : linearItemTrails.length - 1]

                if (evt.shiftKey && !noneSelected) {
                    let selectedEdgeId = orderedSelectedIds[direction < 0 ? 0 : orderedSelectedIds.length - 1]
                    newSelectedIds = outline.getIdsBetween(list, [edgeItem.id, selectedEdgeId])

                    if (direction === this.state.appendSelectionType) {
                        newSelectedIds.push(...orderedSelectedIds.filter(id => id !== selectedEdgeId))
                    } else {
                        this.setState({appendSelectionType: direction})
                    }
                } else {
                    newSelectedIds = [edgeItem.id]
                }
            } else {
                if (!evt.shiftKey || direction === this.state.appendSelectionType) {
                    let selectedEdgeId = orderedSelectedIds[direction < 0 ? 0 : orderedSelectedIds.length - 1]
                    let index = linearItemTrails.findIndex(([item]) => item.id === selectedEdgeId)
                    let newIndex = Math.max(0, Math.min(linearItemTrails.length - 1, index + direction))
                    let newId = linearItemTrails[newIndex][0].id

                    newSelectedIds = [newId]
                    if (evt.shiftKey) newSelectedIds.push(...orderedSelectedIds)
                } else {
                    let selectedEdgeId = orderedSelectedIds[direction > 0 ? 0 : orderedSelectedIds.length - 1]
                    newSelectedIds = [...orderedSelectedIds].filter(id => id !== selectedEdgeId)
                }
            }

            this.handleSelectionChange({selectedIds: newSelectedIds})
        } else if ([38, 40].includes(evt.keyCode) && evt.ctrlKey) {
            // Ctrl + Arrow Up/Down
            // Moving items

            evt.preventDefault()

            let direction = evt.keyCode === 38 ? -1 : 1
            let newSelectedIds = this.getDescendantItemIds(selectedIds)
            let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
            let targetIds = linearItemTrails.filter(([item, ...parents]) =>
                newSelectedIds.includes(item.id)
                && parents.every(parent => !newSelectedIds.includes(parent.id))
            ).map(([item]) => item.id)

            if (direction > 0) {
                targetIds.reverse()
            }

            let cancel = false
            let newList = targetIds.reduce((list, id) => {
                if (cancel) return list

                let itemTrail = outline.getItemTrail(list, id)
                let sublist = itemTrail[1] == null ? list : itemTrail[1].sublist
                let index = sublist.indexOf(itemTrail[0]) + direction

                if (index < 0 || index >= sublist.length) {
                    cancel = true
                    return list
                }

                let op = direction > 0 ? 'after' : 'before'
                return outline.move(list, itemTrail, op, sublist[index].id)
            }, list)

            onChange({list: cancel ? list : newList})
            this.handleSelectionChange({selectedIds: newSelectedIds})
        } else if ([37, 39].includes(evt.keyCode) && !evt.ctrlKey) {
            // Arrow Left/Right
            // Toggle collapse items

            evt.preventDefault()

            let type = evt.keyCode === 37 ? -1 : 1
            let newList = selectedIds.reduce((list, id) => (
                outline.update(list, id, {collapsed: type < 0})
            ), list)

            onChange({list: newList})
        } else if (evt.keyCode === 37 && evt.ctrlKey) {
            // Ctrl + Arrow Left
            // Jump to parent item

            evt.preventDefault()

            if (selectedIds.length !== 1) return

            let [item, parent, ] = outline.getItemTrail(list, selectedIds[0])
            if (parent == null) return

            this.handleSelectionChange({selectedIds: [parent.id]})
        } else if ([46, 8].includes(evt.keyCode)) {
            // Del, Backspace
            // Remove items

            evt.preventDefault()
            this.removeItems()
        } else if (evt.keyCode === 9 && !evt.ctrlKey) {
            // Tab
            // Indent/Unindent items

            evt.preventDefault()

            let {editId} = this.state
            this.cancelEdit()

            let targetIds = this.getDescendantItemIds(selectedIds)
            let linearIds = outline.getLinearItemTrails(list).map(([item]) => item.id)
            let lines = outline.stringify(list).split('\n')
            let targetIndices = targetIds.map(id => linearIds.indexOf(id))

            let newLines = lines.map((x, i) => {
                if (!targetIndices.includes(i)) return x

                if (!evt.shiftKey) {
                    return ' '.repeat(4) + x
                } else {
                    return x.replace(/^ {4}/, '')
                }
            })

            let newList = outline.parse(newLines.join('\n'), {ids: linearIds})

            newList = selectedIds.reduce((list, id) => (
                outline.reveal(list, id)
            ), newList)

            onChange({list: newList})
            this.handleSelectionChange({selectedIds: targetIds})
            this.setState({editId})
        } else if (evt.keyCode === 13 && !evt.shiftKey) {
            // Enter
            // Edit mode

            evt.preventDefault()

            let orderedSelectedIds = outline
                .getLinearItemTrails(list, {includeCollapsed: false})
                .filter(([item]) => selectedIds.includes(item.id))
                .map(([item]) => item.id)

            if (orderedSelectedIds.length === 0) return

            this.startEdit({id: orderedSelectedIds[0]})
        } else if (evt.keyCode === 13 && evt.shiftKey) {
            // Shift + Enter
            // Insert item

            evt.preventDefault()

            let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
            let orderedSelectedItems = linearItemTrails
                .filter(([item]) => selectedIds.includes(item.id))
                .map(([item]) => item)
            let [lastSelectedItem] = orderedSelectedItems.slice(-1)
            let insertSubitem = lastSelectedItem != null
                && !lastSelectedItem.collapsed
                && lastSelectedItem.sublist.length > 0

            let newList = outline.append(list, {})
            let [newItem] = newList.slice(-1)

            if (lastSelectedItem != null) {
                if (!insertSubitem) {
                    newList = outline.move(newList, [newItem], 'after', lastSelectedItem.id)
                } else {
                    newList = outline.move(newList, [newItem], 'before', lastSelectedItem.sublist[0].id)
                }
            }

            onChange({list: newList})
            this.cancelEdit()
            this.forceUpdate()

            onSelectionChange({selectedIds: [newItem.id]})
            this.setState({editId: newItem.id})
        } else if (evt.keyCode === 27) {
            // Esc
            // Lose focus

            evt.preventDefault()

            let {onBlur = () => {}} = this.props

            this.element.blur()
            onBlur()
        } else if (48 <= evt.keyCode && evt.keyCode <= 57 && evt.ctrlKey) {
            // Ctrl + Number
            // Collapse level

            evt.preventDefault()

            let number = evt.keyCode - 48
            let newList = number === 0 ? outline.expandAll(list) : outline.collapseLevel(list, number - 1)

            onChange({list: newList})
        } else if ([67, 88].includes(evt.keyCode) && evt.ctrlKey) {
            // Ctrl + C, Ctrl + X
            // Copy & Cut

            evt.preventDefault()

            let newSelectedIds = this.getDescendantItemIds(selectedIds)
            let targetIds = newSelectedIds.filter(id => (
                outline.getItemTrail(list, id).slice(1)
                .every(parent => !newSelectedIds.includes(parent.id))
            ))

            let copyList = targetIds.map(id => outline.getItemTrail(list, id)[0])
            let text = outline.stringify(copyList)

            copyText(text)
            this.element.focus()
            this.clipboardData = copyList

            if (evt.keyCode === 67) {
                this.handleSelectionChange({selectedIds: newSelectedIds})
            } else {
                this.removeItems()
            }
        } else if (evt.keyCode === 86 && evt.ctrlKey) {
            // Ctrl + V
            // Paste

            evt.preventDefault()
            if (this.clipboardData == null) return

            let selectedId = selectedIds[0]
            let maxId = outline.getMaxId(list)

            let reassignIds = list => list.map(item => ({
                ...item,
                id: ++maxId,
                sublist: reassignIds(item.sublist)
            }))

            let clipboardData = reassignIds(this.clipboardData)
            let newList = [...list, ...clipboardData]
            let pastedIds = clipboardData.map(item => item.id)

            if (selectedId != null) {
                newList = pastedIds.reduce((list, id) => (
                    outline.move(list, id, 'before', selectedId)
                ), newList)
            } else {
                onSelectionChange({selectedIds: pastedIds})
            }

            onChange({list: newList})
        } else if (evt.keyCode === 88) {
            // x
            // Toggle check items

            evt.preventDefault()

            let firstSelectedItemElement = this.element.querySelector('.outline-item.selected')
            if (firstSelectedItemElement == null || selectedIds.length === 0) return

            let targetIds = this.getDescendantItemIds(selectedIds, true)
            let checked = !firstSelectedItemElement.classList.contains('checked')
            let newList = targetIds.reduce((list, id) => (
                outline.update(list, id, {checked})
            ), list)

            onChange({list: newList})
        }
    }

    render() {
        let {editId, focused} = this.state
        let {disabled, list, selectedIds} = this.props
        let showCollapse = list.some(item => item.sublist.length > 0)

        return <section
            ref={el => this.element = el}
            class={classnames('outline-view', {focused})}
            tabIndex={!disabled && 0}

            onFocus={this.gotFocus}
            onBlur={this.lostFocus}
            onKeyDown={this.handleKeyDown}
        >
            {list.length === 0 &&
                <div class="message">
                    {!disabled ? [
                        <h2>No items</h2>,
                        <p>Press <kbd>Shift</kbd>+<kbd>Enter</kbd> to insert an item</p>
                    ] : (
                        <h2>No documents</h2>
                    )}
                </div>
            }

            <OutlineList
                list={list}
                level={0}
                showCollapse={showCollapse}
                selectedIds={selectedIds}
                editId={editId}

                onItemClick={this.handleItemClick}
                onItemDoubleClick={this.startEdit}
                onChange={this.props.onChange}
                onCancelEdit={this.cancelEdit}
            />
        </section>
    }
}
