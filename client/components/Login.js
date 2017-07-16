import {h, Component} from 'preact'

export default class Login extends Component {
    constructor() {
        super()

        this.state = {user: '', pass: ''}
    }

    componentDidMount() {
        this.userElement.focus()
    }

    handleUserChange = evt => {
        this.setState({user: evt.currentTarget.value})
    }

    handlePassChange = evt => {
        this.setState({pass: evt.currentTarget.value})
    }

    handleButtonClick = evt => {
        evt.preventDefault()

        let {onLogin = () => {}} = this.props
        onLogin(this.state)
    }

    render()  {
        return <form id="login">
            <h2>Login</h2>
            <p>
                <input
                    ref={el => this.userElement = el}
                    type="text"
                    placeholder="Username"
                    value={this.state.user}
                    onInput={this.handleUserChange}
                />
            </p>
            <p>
                <input
                    type="text"
                    placeholder="Personal Access Token"
                    value={this.state.pass}
                    onInput={this.handlePassChange}
                />
            </p>
            <p>
                <button type="submit" onClick={this.handleButtonClick}>Login</button>
            </p>
        </form>
    }
}
