import {h, Component} from 'preact'
import classNames from 'classnames'

export default class Busy extends Component {
    render() {
        return <div class={classNames({show: this.props.show})} id="busy"/>
    }
}
