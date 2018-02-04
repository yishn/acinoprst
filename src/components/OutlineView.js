import {h, Component} from 'preact'
import classnames from 'classnames'
import scrollIntoView from 'scroll-into-view-if-needed'
import * as outline from '../outline'
import OutlineList from './OutlineList'

export default class OutlineView extends Component {
    constructor(props) {
        super(props)

        this.state = {
            focused: false,
            appendSelectionType: 0
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.selectedIds.length <= 1) {
            this.setState({appendSelectionType: 0})
        }
    }

    componentDidUpdate(prevProps) {
        let {list, selectedIds} = this.props

        if (prevProps.list !== list) {
            this.handleSelectionChange({selectedIds: selectedIds})
        } else {
            if (JSON.stringify(prevProps.selectedIds) !== JSON.stringify(selectedIds)) {
                let edgeSelectedId = selectedIds[this.state.appendSelectionType > 0 ? selectedIds.length - 1 : 0]
                let element = this.element.querySelector(`.outline-item[data-id="${edgeSelectedId}"]`)

                if (element != null) scrollIntoView(element, {duration: 200})
            }
        }
    }

    gotFocus = () => this.setState({focused: true})
    lostFocus = () => this.setState({focused: false})

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

        let newSelectedIds = [...selectedIds]
            .sort((x, y) => x - y)
            .filter((x, i, arr) => i === 0 || arr[i - 1] !== x)
            .filter(id => outline.getItemTrail(list, id).length > 0)

        onSelectionChange({selectedIds: newSelectedIds})
    }

    handleKeyDown = evt => {
        let {list, selectedIds, onChange = () => {}} = this.props

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
            // Arrow Up/Down
            // Moving items

            evt.preventDefault()
        } else if ([37, 39].includes(evt.keyCode)) {
            // Arrow Left/Right
            // Toggle collapse items

            evt.preventDefault()

            let type = evt.keyCode === 37 ? -1 : 1
            let newList = selectedIds.reduce((list, id) => (
                outline.update(list, id, {collapsed: type < 0})
            ), list)

            onChange({list: newList})
        } else if (evt.keyCode === 46) {
            // Del
            // Remove item

            evt.preventDefault()

            let targetIds = selectCollapsed(selectedIds)
            let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
            let newSelectedIndex = linearItemTrails.findIndex(([item]) => targetIds.includes(item.id)) - 1
            if (newSelectedIndex < 0)
                newSelectedIndex = linearItemTrails.findIndex(([item]) => !targetIds.includes(item.id))
            let newSelectedIds = newSelectedIndex < 0 ? [] : [linearItemTrails[newSelectedIndex][0].id]

            let newList = targetIds.reverse().reduce((list, id) => {
                let [item, parent, ] = outline.getItemTrail(list, id)
                let parentList = parent != null ? parent.sublist : list
                let index = parentList.indexOf(item)
                if (index < 0) return list

                let subitemIds = item.sublist.map(x => x.id)

                if (index === 0) {
                    list = subitemIds.reverse().reduce((list, subId) => (
                        outline.move(list, subId, 'before', id)
                    ), list)
                } else {
                    let targetId = parentList[index - 1].id

                    list = subitemIds.reduce((list, subId) => (
                        outline.move(list, subId, 'in', targetId)
                    ), list)
                }
                
                return outline.remove(list, id)
            }, list)
            
            onChange({list: newList})
            this.handleSelectionChange({selectedIds: newSelectedIds})
        } else if (evt.keyCode === 9 && !evt.ctrlKey) {
            // Tab
            // Indent/Unindent items

            evt.preventDefault()

            let targetIds = selectCollapsed(selectedIds)
            if (evt.shiftKey) targetIds.reverse()

            let newList = targetIds.reduce((list, id) => {
                let [item, parent, ] = outline.getItemTrail(list, id)
                
                if (!evt.shiftKey) {
                    let parentList = parent != null ? parent.sublist : list
                    let index = parentList.indexOf(item)
                    if (index <= 0) return list

                    let targetId = parentList[index - 1].id
                    let subitemIds = item.sublist.map(x => x.id)

                    return subitemIds.reverse().reduce((list, subId) => (
                        outline.move(list, subId, 'after', id)
                    ), outline.move(list, id, 'in', targetId))
                } else {
                    if (parent == null) return list
                    let index = parent.sublist.indexOf(item)
                    let newSubitemIds = parent.sublist.slice(index + 1).map(x => x.id)

                    list = newSubitemIds.reduce((list, subId) => (
                        outline.move(list, subId, 'in', id)
                    ), list)

                    return outline.move(list, id, 'after', parent.id)
                }
            }, list)

            onChange({list: newList})
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
        let {focused} = this.state
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

                onItemClick={this.handleItemClick}
                onChange={this.props.onChange}
            />
        </section>
    }
}
