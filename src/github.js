import qs from 'querystring'

export function extractUrlInfo(url, hasId = false) {
    try {
        let obj = new URL(url)
        let segments = obj.pathname.match(/[^\/]+/g).slice(-2)
        if (segments.length < 2) segments.unshift('')
        
        return {
            host: obj.hostname.slice(-10) === 'github.com' ? 'github.com' : obj.hostname,
            user: segments[hasId ? 0 : 1],
            id: hasId ? segments[1] : null
        }
    } catch (err) {
        if (hasId) throw err
    }

    return {
        host: 'github.com',
        user: url,
        id: null
    }
}

export default class GitHub {
    constructor({user = null, pass = null, host = 'github.com'} = {}) {
        this.host = host
        this.apiEndpoint = host !== 'github.com' ? `${host}/api/v3` : 'api.github.com'

        this.setAuthorization(user, pass)
    }

    setAuthorization(user = null, pass = null) {
        if (user == null) this.authorization = null
        else this.authorization = btoa(`${user}:${pass}`)

        return this
    }

    makeHeaders() {
        let headers = {
            'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT'
        }

        if (this.authorization != null) {
            headers.Authorization = `Basic ${this.authorization}`
        }

        return headers
    }

    getUser() {
        return fetch(`https://${this.apiEndpoint}/user`, {
            headers: this.makeHeaders()
        }).then(res => {
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        })
    }

    getGist(id) {
        return fetch(`https://${this.apiEndpoint}/gists/${id}`, {
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
        return fetch(`https://${this.apiEndpoint}/gists`, {
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
        return fetch(`https://${this.apiEndpoint}/gists/${id}`, {
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
