import 'regenerator-runtime/runtime'
import Promise from 'pinkie-promise'
window.Promise = Promise

import querystring from 'querystring'
import {h, render} from 'preact'
import App from './components/App'

render(<App/>, document.body)
