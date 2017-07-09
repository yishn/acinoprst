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
    }
})
