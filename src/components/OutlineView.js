import {h, Component} from 'preact'
import classnames from 'classnames'
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

    scrollIntoView(id) {
        let element = this.element.querySelector(`.outline-item[data-id="${id}"] > .inner`)
        if (element != null) scrollIntoView(element)
    }

    handleItemClick = evt => {
        let {ctrlKey, shiftKey} = evt.mouseEvent
        let {list, selectedIds} = this.props
        let newSelectedIds = []

        if (shiftKey) {
            newSelectedIds = outline.getIdsBetween(list, [evt.id, ...selectedIds])
        } else if (ctrlKey) {
            newSelectedIds = [evt.id, ...selectedIds]
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

    handleCancelEdit = () => {
        let {scrollTop} = this.element
        this.element.focus()

        this.setState({editId: null}, () => {
            this.element.scrollTop = scrollTop
        })
    }

    handleKeyDown = evt => {
        let {list, selectedIds, onChange = () => {}, onSelectionChange = () => {}} = this.props

        function selectCollapsed(selectedIds) {
            let result = [...selectedIds]

            for (let id of selectedIds) {
                let trail = outline.getItemTrail(list, id)
                if (trail.length === 0 || !trail[0].collapsed) continue

                for (let subtrail of outline.getDescendantTrails(list, trail)) {
                    if (subtrail.length === 0) continue
                    result.push(subtrail[0].id)
                }
            }

            return result
        }

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
            let targetIds = selectCollapsed(selectedIds)
            let linearIds = outline.getLinearItemTrails(list).map(([item]) => item.id)
            let lines = outline.stringify(list).split('\n')
            let targetIndices = targetIds.map(id => linearIds.indexOf(id))
            let newTargetIndices = targetIndices.map(i => i + direction)
            if (newTargetIndices.some(i => i < 0 || i >= lines.length)) return

            let remainingIndices = newTargetIndices.filter(i => !targetIndices.includes(i))
            let revealIds = dedupe([...targetIds, ...remainingIndices.map(i => linearIds[i])])
            let permutation = lines.map((_, i) =>
                newTargetIndices.includes(i) ? i - direction
                : targetIndices.includes(i) ? remainingIndices.shift()
                : i
            )

            let newLines = permutation.map(i => lines[i])
            let newLinearIds = permutation.map(i => linearIds[i])
            let newList = outline.parse(newLines.join('\n'), {ids: newLinearIds})

            newList = revealIds.reduce((list, id) => (
                outline.reveal(list, id)
            ), newList)

            onChange({list: newList})
            this.handleSelectionChange({selectedIds: targetIds})
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
            // Remove item

            evt.preventDefault()

            let targetIds = selectCollapsed(selectedIds)
            let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
            let newSelectedIndex = linearItemTrails.findIndex(([item]) => targetIds.includes(item.id)) - 1
            if (newSelectedIndex < 0)
                newSelectedIndex = linearItemTrails.findIndex(([item]) => !targetIds.includes(item.id))
            let newSelectedIds = newSelectedIndex < 0 ? [] : [linearItemTrails[newSelectedIndex][0].id]

            let linearIds = outline.getLinearItemTrails(list).map(([item]) => item.id)
            let lines = outline.stringify(list).split('\n')
            let targetIndices = targetIds.map(id => linearIds.indexOf(id))
            let newLines = lines.map((x, i) => !targetIndices.includes(i) ? x : null).filter(x => x != null)
            let newList = outline.parse(newLines.join('\n'), {
                ids: linearIds.filter(id => !targetIds.includes(id))
            })

            onChange({list: newList})
            onSelectionChange({selectedIds: newSelectedIds})
        } else if (evt.keyCode === 9 && !evt.ctrlKey) {
            // Tab
            // Indent/Unindent items

            evt.preventDefault()
            this.handleCancelEdit()

            let targetIds = selectCollapsed(selectedIds)
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
        } else if (evt.keyCode === 13 && !evt.shiftKey) {
            // Enter
            // Edit mode

            evt.preventDefault()

            let {scrollTop} = this.element
            let orderedSelectedIds = outline
                .getLinearItemTrails(list, {includeCollapsed: false})
                .filter(([item]) => selectedIds.includes(item.id))
                .map(([item]) => item.id)

            if (orderedSelectedIds.length === 0) return

            onSelectionChange({selectedIds: [orderedSelectedIds[0]]})
            this.setState({editId: orderedSelectedIds[0]}, () => {
                this.element.scrollTop = scrollTop
            })
        } else if (evt.keyCode === 27) {
            // Esc
            // Lose focus

            evt.preventDefault()

            let {onBlur = () => {}} = this.props

            this.element.blur()
            onBlur()
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
            this.handleCancelEdit()
            this.forceUpdate()

            onSelectionChange({selectedIds: [newItem.id]})
            this.setState({editId: newItem.id})
        } else if (evt.keyCode === 88) {
            // x
            // Toggle check items

            evt.preventDefault()

            let firstSelectedItemElement = this.element.querySelector('.outline-item.selected')
            if (firstSelectedItemElement == null || selectedIds.length === 0) return

            let targetIds = selectCollapsed(selectedIds)
            let checked = !firstSelectedItemElement.classList.contains('checked')
            let newList = targetIds.reduce((list, id) => (
                outline.update(list, id, {checked})
            ), list)

            onChange({list: newList})
        }
    }

    render() {
        let {editId, focused} = this.state
        let {list, selectedIds} = this.props
        let showCollapse = list.some(item => item.sublist.length > 0)

        return <section
            ref={el => this.element = el}
            class={classnames('outline-view', {focused})}
            tabIndex={0}

            onFocus={this.gotFocus}
            onBlur={this.lostFocus}
            onKeyDown={this.handleKeyDown}
        >
            <OutlineList
                list={list}
                level={0}
                showCollapse={showCollapse}
                selectedIds={selectedIds}
                editId={editId}

                onItemClick={this.handleItemClick}
                onChange={this.props.onChange}
                onCancelEdit={this.handleCancelEdit}
            />
        </section>
    }
}
