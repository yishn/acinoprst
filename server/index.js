const fs = require('fs')
const path = require('path')
const querystring = require('querystring')
const express = require('express')
const request = require('request')

let app = express()

// Serve static files

let staticFolders = ['node_modules/octicons/build/svg', 'static']

for (let folder of staticFolders) {
    app.use('/' + folder, express.static(path.join(__dirname, '..', folder)))
}

// Handle OAuth authentication

app.get('/login', (req, res) => {
    let {client_id, client_secret} = require('../config')

    if (req.query.code != null) {
        // Retrieve OAuth token

        request.post({
            url: 'https://github.com/login/oauth/access_token',
            form: {client_id, client_secret, code: req.query.code}
        }, (err, data, body) => {
            let {access_token} = querystring.parse(body)
            res.redirect(`/?access_token=${access_token}`)
        })
    } else {
        // Redirect to GitHub

        res.redirect([
            'http://github.com/login/oauth/authorize',
            `?client_id=${client_id}`,
            `&scope=gist`
        ].join(''))
    }
})

// Serve app

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(3000, () => {
    console.log('Listening on port 3000...')
})
