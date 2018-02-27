import qs from 'querystring'
import {Base64} from 'js-base64'
import fetch from 'unfetch'

export default class GitHub extends Component {
    constructor(user, pass) {
        this.authorization = Base64.encode(`${user}:${pass}`)
    }

    makeHeaders() {
        return {
            'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
            'Authorization': `Basic ${this.authorization}`
        }
    }

    async getUser() {
        let res = await fetch('https://api.github.com/user', {
            headers: makeHeaders()
        })

        if (!res.ok) throw new Error(res.statusText)
        return res.json()
    }

    async getGist(id) {
        let res = await fetch(`https://api.github.com/gists/${id}`, {
            headers: makeHeaders()
        })

        if (!res.ok) throw new Error(res.statusText)
        return res.json()
    }

    async getGistContent(id) {
        let gist = this.getGist(id)
        let fileNames = Object.keys(gist.files)
        let file = gist.files[fileNames[0]]
        if (file == null) throw new Error('File not found')
        if (!file.truncated) return file.content

        let res = await fetch(file.raw_url)
        if (!res.ok) throw new Error('Could not retrieve file')
        return res.text()
    }

    async createGist(options) {
        let res = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                ...makeHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        })

        if (!res.ok) throw new Error(res.statusText)
        return res.json()
    }
}
