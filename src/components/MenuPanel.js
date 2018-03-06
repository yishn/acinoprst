import {h, Component} from 'preact'
import classnames from 'classnames'
import Toolbar, {ToolbarButton} from './Toolbar'

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
    state = {
        gistUrl: '',
        accessToken: ''
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.user != null && nextProps.user == null) {
            this.setState({
                gistUrl: '',
                accessToken: ''
            }, () => {
                this.gistUrlInput.focus()
            })
        }
    }

    handleLogin = evt => {
        evt.preventDefault()
        let {onLogin = () => {}} = this.props

        onLogin({
            gistUrl: this.state.gistUrl,
            accessToken: this.state.accessToken
        })
    }

    handleGistUrlChange = evt => {
        this.setState({gistUrl: evt.currentTarget.value})
    }

    handleAccessTokenChange = evt => {
        this.setState({accessToken: evt.currentTarget.value})
    }

    render() {
        let {user, show, docs, currentIndex} = this.props
        let login = user == null

        return <section class={classnames('menu-panel', {show, login})}>
            {!login ? (
                <div>
                    <div class="user">
                        <img src={user.avatar}/>
                        <h2>{user.name}</h2>
                    </div>

                    <Toolbar>
                        <ToolbarButton icon="./img/add.svg" text="New Document"/>
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
                                <label>
                                    <strong>Gist URL:</strong>
                                    <input
                                        ref={el => this.gistUrlInput = el}
                                        value={this.state.gistUrl}
                                        onInput={this.handleGistUrlChange}
                                    />
                                </label>
                            </li>
                            <li>
                                <label>
                                    <strong>Access Token:</strong>
                                    <input
                                        value={this.state.accessToken}
                                        onInput={this.handleAccessTokenChange}
                                    />
                                </label>
                            </li>
                            <li class="buttons">
                                <button onClick={this.handleLogin}>Login</button>
                            </li>
                        </ul>
                    </form>
                </div>
            )}
        </section>
    }
}
