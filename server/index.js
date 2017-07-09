const fs = require('fs')
const path = require('path')
const express = require('express')
const github = require('./github')(require('../config'))

let app = express()

// Serve static files

let staticFolders = ['node_modules/octicons/build/svg', 'static']

for (let folder of staticFolders) {
    app.use('/' + folder, express.static(path.join(__dirname, '..', folder)))
}

// Handle OAuth authentication

app.get('/login', (req, res) => {
    if (req.query.code == null) {
        res.redirect(github.getAuthorizationLink({scope: 'gist'}))
    } else {
        github.getOAuthToken(req.query.code, (err, token) => {
            if (err) return res.redirect('/')
            res.redirect(`/?access_token=${token}`)
        })
    }
})

// Serve app

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(3000, () => {
    console.log('Listening on port 3000...')
})
