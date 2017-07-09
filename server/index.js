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

app.get('/markdown', (req, res) => {
    github.getGists(req.query.access_token, {per_page: 100}, (err, data) => {
        if (err || data.message != null) return res.status(404).send()

        let gist = data.find(x => x.description === 'acinoprst')
        if (gist == null) return res.status(404).send()

        let file = gist.files[Object.keys(gist.files)[0]]
        if (file == null) return res.status(404).send()

        request.get(file.raw_url, (err, _, data) => {
            if (err) return res.status(404).send()

            res.set('Content-Type', 'text/markdown')
            res.send(data)
        })
    })
})

// Serve app

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(3000, () => {
    console.log('Listening on port 3000...')
})
