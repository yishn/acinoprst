import {h, Component} from 'preact'
import classnames from 'classnames'

export default class BusyScreen extends Component {
    render() {
        let {show} = this.props

        return <section class={classnames('busy-screen', {show})} />
    }
}
