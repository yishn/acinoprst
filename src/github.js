import qs from 'querystring'
import {Base64} from 'js-base64'
import fetch from 'unfetch'

export let authorization = null

export function login(user, pass) {
    authorization = Base64.encode(`${user}:${pass}`)
}

export function logout(user, pass) {
    authorization = null
}

export function makeHeaders() {
    return {'Authorization': `Basic ${authorization}`}
}

export function getGists(options) {
    if (authorization == null) return Promise.reject(new Error('Not logged in'))

    return fetch(`https://api.github.com/gists?${qs.stringify(options)}`, {
        headers: makeHeaders()
    })
    .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
}

export function removeGist(id) {
    if (authorization == null) return Promise.reject(new Error('Not logged in'))

    return fetch(`https://api.github.com/gists/${id}`, {
        method: 'DELETE',
        headers: makeHeaders()
    })
    .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.text())
}

export function createGist(options) {
    if (authorization == null) return Promise.reject(new Error('Not logged in'))

    return fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            ...makeHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
    })
    .then(res => !res.ok ? Promise.reject(new Error(res.statusText)) : res.json())
}

export function pullAcinoprstGist() {
    return getGists({per_page: 100})
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
}

export function pushAcinoprstGist(oldId, content) {
    return removeGist(oldId)
    .then(() => createGist({
        description: 'acinoprst',
        public: false,
        files: {'acinoprst.md': {content}}
    }))
}
