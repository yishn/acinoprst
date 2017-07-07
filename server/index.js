const fs = require('fs')
const express = require('express')

let app = express()

// Serve static files

let staticFolders = ['node_modules/octicons/build/svg', 'static']

for (let folder of staticFolders) {
    app.use('/' + folder, express.static(folder))
}

// Serve app

app.get('/', (_, res) => {
    fs.readFile('./index.html', 'utf8', (err, data) => {
        if (err) return
        res.send(data)
    })
})

app.listen(3000, () => {
    console.log('Listening on port 3000...')
})
