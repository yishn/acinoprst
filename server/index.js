const fs = require('fs')
const path = require('path')
const express = require('express')

let app = express()

// Serve static files

let staticFolders = ['node_modules/octicons/build/svg', 'static']

for (let folder of staticFolders) {
    app.use('/' + folder, express.static(folder))
}

// Serve app

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(3000, () => {
    console.log('Listening on port 3000...')
})
