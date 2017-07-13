import qs from 'querystring'
import fetch from 'unfetch'

export default token => ({
    makeHeaders() {
        return {
            'Authorization': `token ${token}`,
            'User-Agent': 'acinoprst'
        }
    },

    getGists(options) {
        return fetch(`https://api.github.com/gists?${qs.stringify(options)}`, {
            headers: this.makeHeaders(token)
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
    },

    removeGist(id) {
        return fetch(`https://api.github.com/gists/${id}`, {
            method: 'DELETE',
            headers: this.makeHeaders(token)
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
    },

    createGist(options) {
        return fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                ...this.makeHeaders(token),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        })
        .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
    },

    getAcinoprstGist() {
        return this.getGists({per_page: 100})
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

    syncAcinoprstGist(oldId, content) {
        return this.removeGist(oldId)
        .then(() => this.createGist({
            description: 'acinoprst',
            public: false,
            files: {'acinoprst.md': {content}}
        }))
    }
})
