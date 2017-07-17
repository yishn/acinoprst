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
    return {
        'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
        'Authorization': `Basic ${authorization}`
    }
}

export async function getGists(options) {
    if (authorization == null) throw new Error('Not logged in')

    let res = await fetch(`https://api.github.com/gists?${qs.stringify(options)}`, {
        headers: makeHeaders()
    })

    if (!res.ok) throw new Error(res.statusText)
    return await res.json()
}

export async function removeGist(id) {
    if (authorization == null) throw new Error('Not logged in')

    let res = await fetch(`https://api.github.com/gists/${id}`, {
        method: 'DELETE',
        headers: makeHeaders()
    })

    if (!res.ok) throw new Error(res.statusText)
    return await res.text()
}

export async function createGist(options) {
    if (authorization == null) throw new Error('Not logged in')

    let res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            ...makeHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
    })

    if (!res.ok) throw new Error(res.statusText)
    return await res.json()
}

export async function pullAcinoprstGist() {
    let data = await getGists({per_page: 100})
    let err = new Error('Not found')
    let gist = data.find(x => x.description === 'acinoprst')
    if (gist == null) throw err

    let file = gist.files[Object.keys(gist.files)[0]]
    if (file == null) throw err

    delete gist.files
    gist.file = file

    let res = await fetch(file.raw_url)

    if (!res.ok) throw new Error(res.statusText)
    let content = await res.text()

    file.content = content
    return gist
}

export async function pushAcinoprstGist(oldId, content) {
    await removeGist(oldId)

    return createGist({
        description: 'acinoprst',
        public: false,
        files: {'acinoprst.md': {content}}
    })
}
