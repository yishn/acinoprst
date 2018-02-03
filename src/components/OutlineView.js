import {h, Component} from 'preact'
import classnames from 'classnames'
import * as outline from '../outline'
import OutlineList from './OutlineList'

export default class OutlineView extends Component {
    constructor(props) {
        super(props)

        this.state = {
            focused: false
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.list !== this.props.list) {
            this.handleSelectionChange({selectedIds: this.props.selectedIds})
        }
    }

    gotFocus = () => {
        this.setState({focused: true})
    }

    lostFocus = () => {
        this.setState({focused: false})
    }

    handleItemClick = evt => {
        let {ctrlKey, shiftKey} = evt.mouseEvent
        let {list, selectedIds} = this.props
        let newSelectedIds = []

        if (shiftKey) {
            let linearItemTrails = outline.getLinearItemTrails(list)
            let selectedIndices = [evt.id, ...selectedIds]
                .map(id => linearItemTrails.findIndex(([item]) => item.id === id))
            let [minIndex, maxIndex] = selectedIndices.filter(x => x >= 0)
                .reduce(([min, max], i) => [Math.min(i, min), Math.max(i, max)], [Infinity, -Infinity])

            newSelectedIds = linearItemTrails.slice(minIndex, maxIndex + 1).map(([item]) => item.id)
        } else if (ctrlKey) {
            newSelectedIds = [evt.id, ...selectedIds]
        } else {
            newSelectedIds = [evt.id]
        }

        this.handleSelectionChange({selectedIds: newSelectedIds})
    }

    handleSelectionChange = ({selectedIds}) => {
        let {list, onSelectionChange = () => {}} = this.props
        let newSelectedIds = []

        // Normalize selectedIds

        for (let id of selectedIds) {
            let [item, ...parents] = outline.getItemTrail(list, id)
            if (item == null) continue

            let topCollapsedParent = parents.reverse().find(parent => parent.collapsed)
            
            if (!topCollapsedParent) {
                newSelectedIds.push(id)
            } else {
                newSelectedIds.push(topCollapsedParent.id)
            }
        }

        // Deduplicate

        newSelectedIds = newSelectedIds
            .sort((x, y) => x - y)
            .filter((x, i, arr) => i === 0 || arr[i - 1] !== x)

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

        if ([38, 40, 36, 35].includes(evt.keyCode)) {
            // Arrow Up/Down, Home, End
            // Selection

            evt.preventDefault()

            let direction = [38, 36].includes(evt.keyCode) ? -1 : 1
            let newSelectedIds = []
            let linearItemTrails = outline.getLinearItemTrails(list, {includeCollapsed: false})
            let noneSelected = selectedIds.length === 0

            if (linearItemTrails.length === 0) return

            if ([36, 35].includes(evt.keyCode) || noneSelected) {
                let [edgeItem] = linearItemTrails[direction < 0 || noneSelected ? 0 : linearItemTrails.length - 1]

                newSelectedIds = [edgeItem.id]
            } else {
                selectedIds = linearItemTrails
                    .filter(([item]) => selectedIds.includes(item.id))
                    .map(([item]) => item.id)

                let edgeSelectedId = selectedIds[direction < 0 ? 0 : selectedIds.length - 1]
                let index = linearItemTrails.findIndex(([item]) => item.id === edgeSelectedId)
                let newIndex = Math.max(0, Math.min(linearItemTrails.length - 1, index + direction))
                
                newSelectedIds = [linearItemTrails[newIndex][0].id]
            }

            this.handleSelectionChange({selectedIds: newSelectedIds})
        } else if ([37, 39].includes(evt.keyCode)) {
            // Arrow Left/Right
            // Toggle collapse items

            evt.preventDefault()

            let type = evt.keyCode === 37 ? -1 : 1
            let newList = selectedIds.reduce((list, id) => (
                outline.update(list, id, {collapsed: type < 0})
            ), list)

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

        return <section
            ref={el => this.element = el}
            class={classnames('outline-view', {focused})}
            tabindex="0"

            onFocus={this.gotFocus}
            onBlur={this.lostFocus}
            onKeyDown={this.handleKeyDown}
        >
            <OutlineList 
                list={list}
                level={0}
                selectedIds={selectedIds}
                
                onItemClick={this.handleItemClick}
                onChange={this.props.onChange}
            />
        </section>
    }
}
