import querystring from 'querystring'
import cookies from 'js-cookie'
import {h, render} from 'preact'
import App from './components/App'

let query = querystring.parse(window.location.search.slice(1))
let noQueryHref = window.location.href.replace(window.location.search, '')

if (query.access_token != null) {
    // Set token cookie

    cookies.set('access_token', query.access_token, {path: ''})
    window.location.replace(noQueryHref)
} else if (query.logout != null) {
    // Remove token cookie

    cookies.remove('access_token', {path: ''})
    window.location.replace(noQueryHref)
} else {
    render(<App/>, document.body)
}
