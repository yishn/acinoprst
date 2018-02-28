import {h, Component} from 'preact'
import classnames from 'classnames'
import Toolbar, {ToolbarButton, ToolbarSeparator} from './Toolbar'

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

        return <section class={classnames('menu-panel', {show, login: user == null})}>
            {user != null ? (
                <div>
                    <div class="user">
                        <img src={user.avatar}/>
                        <h2>{user.name}</h2>
                    </div>

                    <Toolbar>
                        <ToolbarButton icon="./img/add.svg" text="New Document"/>
                        <ToolbarSeparator/>
                        <ToolbarButton icon="./img/logout.svg" text="Logout" onClick={this.props.onLogout}/>
                    </Toolbar>

                    <ol class="documents">{docs.map((doc, i) =>
                        <DocumentListItem
                            index={i}
                            current={i === currentIndex}
                            text={doc.title}

                            onClick={this.props.onDocumentClick}
                        />
                    )}</ol>
                </div>
            ) : (
                <div>
                    <div class="user">
                        <img src="./img/github.svg"/>
                        <h2>Login</h2>
                    </div>

                    <form>
                        <ul>
                            <li>
                                <label for="input-gist-url">Gist URL:</label>
                                <input id="input-gist-url"/>
                            </li>
                            <li>
                                <label for="input-access-token">Access Token:</label>
                                <input id="input-access-token"/>
                            </li>
                            <li class="buttons">
                                <button>Login</button>
                            </li>
                        </ul>
                    </form>
                </div>
            )}
        </section>
    }
}
