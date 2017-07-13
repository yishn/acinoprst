import qs from 'querystring'
import fetch from 'unfetch'

let makeHeaders = token => ({
    'Authorization': `token ${token}`,
    'User-Agent': 'acinoprst'
})

export default ({client_id, client_secret}) => ({
    getAuthorizationLink(options = {}) {
        return 'http://github.com/login/oauth/authorize?'
            + qs.stringify(Object.assign({client_id}, options))
    },

    getOAuthToken(code) {
        let formData = new FormData()

        formData.append('client_id', client_id)
        formData.append('client_secret', client_secret)
        formData.append('code', code)

        return fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            body: formData
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.text())
        .then(body => qs.parse(body).access_token)
    },

    getGists(access_token, options) {
        return fetch(`https://api.github.com/gists?${qs.stringify(options)}`, {
            headers: makeHeaders(access_token)
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
    },

    removeGist(access_token, id) {
        return fetch(`https://api.github.com/gists/${id}`, {
            method: 'DELETE',
            headers: makeHeaders(access_token)
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
    },

    createGist(access_token, options) {
        return fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {...makeHeaders(access_token), 'Content-Type': 'application/json'},
            body: JSON.stringify(options)
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
    },

    getAcinoprstGist(access_token) {
        return this.getGists(access_token, {per_page: 100})
        .then(data => {
            let err = new Error('Not found')
            let gist = data.find(x => x.description === 'acinoprst')
            if (gist == null) return Promise.reject(err)

            let file = gist.files[Object.keys(gist.files)[0]]
            if (file == null) return Promise.reject(err)

            delete gist.files
            gist.file = file

            return fetch(file.raw_url)
            .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.text())
            .then(content => (file.content = content, gist))
        })
    },

    syncAcinoprstGist(access_token, oldId, content) {
        return this.removeGist(access_token, oldId)
        .then(() => this.createGist(access_token, {
            description: 'acinoprst',
            public: false,
            files: {'acinoprst.md': {content}}
        }))
    }
})
