const qs = require('querystring')
const request = require('request')

module.exports = ({client_id, client_secret}) => ({
    getAuthorizationLink(options = {}) {
        return 'http://github.com/login/oauth/authorize?'
            + qs.stringify(Object.assign({client_id}, options))
    },

    getOAuthToken(code, callback = () => {}) {
        request.post({
            url: 'https://github.com/login/oauth/access_token',
            form: {client_id, client_secret, code}
        }, (err, _, body) => {
            if (err) return callback(err)

            let {access_token} = qs.parse(body)
            callback(null, access_token)
        })
    }
})
