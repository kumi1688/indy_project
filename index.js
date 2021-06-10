const express = require('express')
const app = express()
const port = 3001

app.use(express.json())
app.use(express.urlencoded())

const {run} = require('./did_manager.js')

app.get('/', (req,res)=>{
    res.send('DID Manager 서버를 가동합니다')
    run()
})

app.listen(port, ()=>{
    console.log(`did manager server is running at http://localhost:${port}`)
})