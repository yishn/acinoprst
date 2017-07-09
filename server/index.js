const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const request = require('request')
const github = require('./github')(require('../config'))

let app = express()

app.use(bodyParser.json())

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

// Fetch and send data

app.get('/gist', (req, res) => {
    github.getAcinoprstGist(req.query.access_token, (err, gist) => {
        if (err) return res.status(404).send()

        res.set('Content-Type', 'application/json')
        res.send(JSON.stringify(gist, null, '  '))
    })
})

app.post('/sync', (req, res) => {
    res.send(JSON.stringify(req.body))
})

// Serve app

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(3000, () => {
    console.log('Listening on port 3000...')
})
