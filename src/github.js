import qs from 'querystring'
import fetch from 'unfetch'

export function extractGistInfo(url) {
    let obj = new URL(url)
    let [user, id] = obj.pathname.match(/[^\/]+/g).slice(-2)
    let host = obj.hostname !== 'gist.github.com' ? `${obj.hostname}/api/v3` : 'api.github.com'

    return {id, user, host}
}

export default class GitHub {
    constructor({user = null, pass = null, host = 'api.github.com'} = {}) {
        this.host = host
        this.setAuthorization(user, pass)
    }

    setAuthorization(user = null, pass = null) {
        if (user == null) this.authorization = null
        else this.authorization = btoa(`${user}:${pass}`)

        return this
    }

    makeHeaders() {
        let headers = {
            'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
        }

        if (this.authorization != null) {
            headers.Authorization = `Basic ${this.authorization}`
        }

        return headers
    }

    getUser() {
        return fetch(`https://${this.host}/user`, {
            headers: this.makeHeaders()
        }).then(res => {
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        })
    }

    getGist(id) {
        return fetch(`https://${this.host}/gists/${id}`, {
            headers: this.makeHeaders()
        }).then(res => {
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        })
    }

    getGistFileContent(gist, filename) {
        let file = gist.files[filename]
        if (file == null) throw new Error('File not found')

        return Promise.resolve().then(() => {
            if (!file.truncated) return file.content

            return fetch(file.raw_url).then(res => {
                if (!res.ok) throw new Error('Could not retrieve file')
                return res.text()
            })
        })
    }

    createGist(options) {
        return fetch(`https://${this.host}/gists`, {
            method: 'POST',
            headers: {
                ...this.makeHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        }).then(res => {
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        })
    }

    editGist(id, options) {
        return fetch(`https://${this.host}/gists/${id}`, {
            method: 'PATCH',
            headers: {
                ...this.makeHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        }).then(res => {
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        })
    }
}
