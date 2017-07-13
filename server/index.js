const fs = require('fs')
const path = require('path')
const qs = require('querystring')
const express = require('express')
const request = require('request')
const {client_id, client_secret} = require('../config')

let app = express()

// Serve static files

let staticFolders = ['node_modules/octicons/build/svg', 'static']

for (let folder of staticFolders) {
    app.use('/' + folder, express.static(path.join(__dirname, '..', folder)))
}

// Handle OAuth authentication

app.get('/login', (req, res) => {
    if (req.query.code == null) {
        res.redirect(`http://github.com/login/oauth/authorize?client_id=${client_id}&scope=gist`)
    } else {
        request.post({
            url: 'https://github.com/login/oauth/access_token',
            form: {client_id, client_secret, code: req.query.code}
        }, (err, _, body) => {
            if (err) return res.redirect('/')

            let token = qs.parse(body).access_token
            if (token == null) return res.redirect('/')

            res.redirect(`/?access_token=${token}`)
        })
    }
})

// Serve app

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(8080, () => {
    console.log('Listening on port 8080...')
})
