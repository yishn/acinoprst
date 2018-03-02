import qs from 'querystring'
import fetch from 'unfetch'

export function getGistInfo(url, user = null, pass = null) {
    return Promise.resolve().then(() => {
        let obj = new URL(url)
        let [id] = obj.pathname.match(/[^\/]+/g).slice(-1)
        let host = obj.hostname !== 'gist.github.com' ? `${obj.hostname}/api` : 'api.github.com'
        let client = new GitHub({user, pass, host})

        return {id, host, client}
    }).then(({id, host, client}) => client.getGist(id).then(gist => {
        let user = gist.owner.login
        let avatar = gist.owner.avatar_url
        let file = gist.files[Object.keys(gist.files)[0]]
        if (file == null) return Promise.reject(new Error('File not found'))

        return Promise.resolve().then(() => {
            if (!file.truncated) return file.content

            return fetch(file.raw_url).then(res => {
                if (!res.ok) return Promise.reject(new Error('Could not retrieve file'))
                return res.text()
            })
        }).then(content => ({id, host, user, avatar, client, content}))
    }))
}

export default class GitHub {
    constructor({user = null, pass = null, host = 'api.github.com'} = {}) {
        this.host = host
        this.setAuthorization(user, pass)
    }

    setAuthorization(user = null, pass = null) {
        if (user == null) this.authorization = null
        else this.authorization = atob(`${user}:${pass}`)
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
            if (!res.ok) return Promise.reject(new Error(res.statusText))
            return res.json()
        })
    }

    getGist(id) {
        return fetch(`https://${this.host}/gists/${id}`, {
            headers: this.makeHeaders()
        }).then(res => {
            if (!res.ok) return Promise.reject(new Error(res.statusText))
            return res.json()
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
            if (!res.ok) return Promise.reject(new Error(res.statusText))
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
            if (!res.ok) return Promise.reject(new Error(res.statusText))
            return res.json()
        })
    }
}
