import {h, Component} from 'preact'
import classnames from 'classnames'

class DocumentListItem extends Component {
    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick({index: this.props.index})
    }

    render() {
        let {current, text} = this.props

        return <li class={classnames({current})}>
            <a href="#" onClick={this.handleClick}>
                <img src="./img/document.svg" />
                <span class="text">{text}</span>
            </a>
        </li>
    }
}

export default class MenuPanel extends Component {
    render() {
        let {user, show, docs, currentIndex} = this.props

        return <section class={classnames('menu-panel', {show})}>
            <div class="user">
                <img src={user.avatar}/>
                <h2>{user.name}</h2>
            </div>

            <ol class="documents">{docs.map((doc, i) => 
                <DocumentListItem
                    index={i}
                    current={i === currentIndex}
                    text={doc.title}

                    onClick={this.props.onDocumentClick}
                />
            )}</ol>
        </section>
    }
}
