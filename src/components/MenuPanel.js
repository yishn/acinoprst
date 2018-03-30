import {h, Component} from 'preact'
import classnames from 'classnames'
import Toolbar, {ToolbarButton} from './Toolbar'

class DocumentListItem extends Component {
    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick({index: this.props.index})
    }

    handleRemoveClick = evt => {
        evt.preventDefault()

        let {onRemoveClick = () => {}} = this.props
        onRemoveClick({index: this.props.index})
    }

    render() {
        let {index, current, text, dragging} = this.props

        return <li class={classnames({current, dragging})}>
            <a
                data-index={index}
                class="title"
                href="#"

                onClick={this.handleClick}
                onMouseDown={this.props.onMouseDown}
            >
                <img src="./img/document.svg" />
                <span>{text}</span>
            </a>

            <a class="remove" href="#" onClick={this.handleRemoveClick} title="Remove">
                <img src="./img/trash.svg" alt="Remove" />
            </a>
        </li>
    }
}

export default class MenuPanel extends Component {
    state = {
        createGist: false,
        profileUrl: '',
        gistUrl: '',
        accessToken: '',
        dragIndex: null,
        dragToIndex: null,
        dragging: false
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.user != null && nextProps.user == null) {
            this.setState({
                profileUrl: '',
                gistUrl: '',
                accessToken: '',
                createGist: false
            }, () => {
                this.urlInput.focus()
            })
        }
    }

    componentDidMount() {
        document.addEventListener('mouseup', this.handleDocumentMouseUp)
        document.addEventListener('mousemove', this.handleDocumentMouseMove)
    }

    componentWillUnmount() {
        document.removeEventListener('mouseup', this.handleDocumentMouseUp)
        document.removeEventListener('mousemove', this.handleDocumentMouseMove)
    }

    getDragPermutation() {
        let dragPermutation = this.props.docs.map((_, i) => i)

        if (this.state.dragging) {
            dragPermutation.splice(this.state.dragIndex, 1)
            dragPermutation.splice(this.state.dragToIndex, 0, this.state.dragIndex)
        }

        return dragPermutation
    }

    handleLogin = evt => {
        evt.preventDefault()
        let {onLogin = () => {}} = this.props

        onLogin({
            createGist: this.state.createGist,
            profileUrl: this.state.profileUrl,
            gistUrl: this.state.gistUrl,
            accessToken: this.state.accessToken
        })
    }

    handleDocumentClick = evt => {
        if (this.state.dragging) return

        let {onDocumentClick = () => {}} = this.props
        onDocumentClick(evt)
    }

    handleDocumentMouseDown = evt => {
        if (evt.button !== 0) return

        this.setState({dragIndex: +evt.currentTarget.dataset.index})
    }

    handleDocumentMouseMove = evt => {
        if (this.state.dragIndex == null) return

        let documentElements = this.documentsElement.querySelectorAll('.documents > li')
        let offsetTops = [...documentElements].map(el => el.offsetTop)
        let dragToIndex = offsetTops.findIndex(top => top > evt.clientY + this.documentsElement.scrollTop) - 1
        if (dragToIndex < -1) dragToIndex = Infinity

        this.setState({
            dragToIndex: Math.max(0, Math.min(this.props.docs.length - 1, dragToIndex)),
            dragging: true
        })
    }

    handleDocumentMouseUp = evt => {
        if (this.state.dragIndex == null) return

        let {onPermutation = () => {}} = this.props
        onPermutation({permutation: this.getDragPermutation()})

        this.setState({
            dragIndex: null,
            dragToIndex: null,
            dragging: false
        })
    }

    render() {
        let {user, show, docs, currentIndex} = this.props
        let login = user == null

        return <section 
            ref={el => this.element = el}
            class={classnames('menu-panel', {show, login})}
        >
            {!login ? (
                <div class="inner">
                    <div class="user">
                        <img class="avatar" src={user.avatar}/>
                        <h2>{user.name}</h2>

                        <Toolbar>
                            <ToolbarButton
                                icon="./img/link.svg"
                                tooltip="Open Gist"
                                onClick={this.props.onOpenGistClick}
                            />
                        </Toolbar>
                    </div>

                    <Toolbar>
                        <ToolbarButton
                            icon="./img/add.svg"
                            text="New Document"
                            onClick={this.props.onNewDocumentClick}
                        />
                        <ToolbarButton
                            icon="./img/logout.svg"
                            text="Logout"
                            onClick={this.props.onLogout}
                        />
                    </Toolbar>

                    <ol ref={el => this.documentsElement = el} class="documents">
                        {this.getDragPermutation().map(i =>
                            <DocumentListItem
                                key={docs[i].id}
                                index={i}
                                dragging={this.state.dragging && i === this.state.dragIndex}
                                current={i === currentIndex}
                                text={docs[i].title}

                                onClick={this.handleDocumentClick}
                                onRemoveClick={this.props.onDocumentRemove}
                                onMouseDown={this.handleDocumentMouseDown}
                            />
                        )}
                    </ol>
                </div>
            ) : (
                <div class="inner">
                    <div class="user">
                        <img src="./img/github.svg"/>
                        <h2>Login</h2>
                    </div>

                    <Toolbar>
                        <ToolbarButton
                            icon="./img/load-gist.svg"
                            text="Load Gist"
                            checked={!this.state.createGist}
                            onClick={() => this.setState({createGist: false})}
                        />
                        <ToolbarButton
                            icon="./img/create-gist.svg"
                            text="Create Gist"
                            checked={this.state.createGist}
                            onClick={() => this.setState({createGist: true})}
                        />
                    </Toolbar>

                    <form>
                        <ul>
                            <li>
                                <label>
                                    <strong>{this.state.createGist ? 'Username or Profile URL:' : 'Gist URL:'}</strong>
                                    <input
                                        ref={el => this.urlInput = el}
                                        autofocus
                                        value={this.state.createGist ? this.state.profileUrl : this.state.gistUrl}
                                        onInput={evt => {
                                            let key = this.state.createGist ? 'profileUrl' : 'gistUrl'
                                            this.setState({[key]: evt.currentTarget.value})
                                        }}
                                    />
                                </label>
                            </li>
                            <li>
                                <label>
                                    <strong>Access Token:</strong>
                                    <input
                                        type="password"
                                        value={this.state.accessToken}
                                        onInput={evt => this.setState({accessToken: evt.currentTarget.value})}
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
