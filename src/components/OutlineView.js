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

    componentDidUpdate({list, selectedIds}) {
        let listChange = list !== this.props.list

        if (listChange) {
            this.handleSelectionChange({selectedIds})
        }
    }

    gotFocus = () => {
        this.setState({focused: true})
    }

    lostFocus = () => {
        this.setState({focused: false})
    }

    handleSelectionChange = ({selectedIds}) => {
        let {list, onSelectionChange = () => {}} = this.props
        let newSelectedIds = []

        function getDescendantIds(list, item) {
            let result = []

            for (let subitem of item.sublist) {
                result.push(subitem.id, ...getDescendantIds(item.sublist, subitem))
            }

            return result
        }

        // Normalize selectedIds

        for (let id of selectedIds) {
            let [item, ...parents] = outline.getItemTrail(list, id)
            if (item == null) continue

            newSelectedIds.push(id)

            // Add collapsed ids

            let collapsedParentIndex = parents.findIndex(parent => parent.collapsed)

            if (collapsedParentIndex >= 0) {
                let collapsedParent = parents[collapsedParentIndex]
                let superlist = parents[collapsedParentIndex + 1]
                    ? parents[collapsedParentIndex + 1].sublist
                    : list

                newSelectedIds.push(collapsedParent.id, ...getDescendantIds(superlist, collapsedParent))
            } else if (item.collapsed) {
                newSelectedIds.push(...getDescendantIds(list, item))
            }
        }

        // Deduplicate

        newSelectedIds = newSelectedIds
            .sort((x, y) => x - y)
            .filter((x, i, arr) => i === 0 || arr[i - 1] !== x)

        onSelectionChange({selectedIds: newSelectedIds})
    }

    handleKeyDown = evt => {
        let {list, selectedIds} = this.props

        if (evt.keyCode === 38 || evt.keyCode === 40) {
            // Arrow Up/Down

            let direction = evt.keyCode === 38 ? -1 : 1
            let newSelectedIds = []
            let linearItemTrails = outline.getLinearItemTrails(list)

            if (linearItemTrails.length === 0) return
            
            if (selectedIds.length === 0) {
                let edgeId = linearItemTrails[direction < 0 ? 0 : linearItemTrails.length - 1][0].id
                newSelectedIds = [edgeId]
            } else {
                selectedIds = linearItemTrails
                    .filter(([item]) => selectedIds.includes(item.id))
                    .map(([item]) => item.id)

                let edgeSelectedId = selectedIds[direction < 0 ? 0 : selectedIds.length - 1]
                let index = linearItemTrails.findIndex(([item, ]) => item.id === edgeSelectedId)
                let newIndex = Math.max(0, Math.min(linearItemTrails.length - 1, index + direction))
                
                newSelectedIds = [linearItemTrails[newIndex][0].id]
            }

            this.handleSelectionChange({selectedIds: newSelectedIds})
        }
    }

    render() {
        let {focused} = this.state
        let {list, selectedIds, onChange = () => {}} = this.props

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
                onChange={onChange}
            />
        </section>
    }
}
