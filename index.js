const express = require('express')
const app = express()
const port = 3001

app.use(express.json())
app.use(express.urlencoded())

const {run, makeSchema, makeCredential} = require('./did_manager.js')

app.get('/', (req,res)=>{
    res.send('DID Manager 서버를 가동합니다')
    run()
})

app.get('/make_schema', async (req,res)=>{
    const [id, schema] = await makeSchema()
    res.status(200).send({
        id, schema
    })
})

app.get('/make_credential', async(req, res)=>{
    makeCredential()
    res.status(200).send('ok')
})

app.listen(port, ()=>{
    console.log(`did manager server is running at http://localhost:${port}`)
})