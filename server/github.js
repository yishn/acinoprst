const qs = require('querystring')
const request = require('request')

let makeHeaders = token => ({
    'Authorization': `token ${token}`,
    'User-Agent': 'acinoprst'
})

module.exports = ({client_id, client_secret}) => ({
    getAuthorizationLink(options = {}) {
        return 'http://github.com/login/oauth/authorize?'
            + qs.stringify(Object.assign({client_id}, options))
    },

    getOAuthToken(code, callback) {
        request.post({
            url: 'https://github.com/login/oauth/access_token',
            form: {client_id, client_secret, code}
        }, (err, _, body) => {
            if (err) return callback(err)

            let {access_token} = qs.parse(body)
            callback(null, access_token)
        })
    },

    getGists(access_token, options, callback) {
        request.get({
            url: 'https://api.github.com/gists',
            qs: options,
            json: true,
            headers: makeHeaders(access_token)
        }, (err, _, data) => {
            if (err) return callback(err)
            callback(null, data)
        })
    },

    getAcinoprstGist(access_token, callback) {
        this.getGists(access_token, {per_page: 100}, (err, data) => {
            if (err) return callback(err)

            err = new Error('Not found')
            if (data.message != null) return callback(err)

            let gist = data.find(x => x.description === 'acinoprst')
            if (gist == null) return callback(err)

            let file = gist.files[Object.keys(gist.files)[0]]
            if (file == null) return callback(err)

            delete gist.files
            gist.file = file

            request.get(file.raw_url, (err, _, data) => {
                if (err) return callback(err)

                file.content = data
                callback(null, gist)
            })
        })
    }
})
