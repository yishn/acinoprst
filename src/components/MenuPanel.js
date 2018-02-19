import {h, Component} from 'preact'
import classnames from 'classnames'

export default class MenuPanel extends Component {
    render() {
        let {show} = this.props

        return <section class={classnames('menu-panel', {show})}>

        </section>
    }
}
