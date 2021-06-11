const path = require('path')
const express = require('express')
const app = express()
const ejs = require('ejs')
const port = 3001

app.use(express.json())
app.use(express.urlencoded())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile);

const didManager = require('./did_manager.js')
const schemaManager = require('./schema_manager.js')

app.get('/page', (req,res)=>{
    res.render('index.html', {name: 'kang'})
})

app.get('/', (req,res)=>{
    res.send('ok')
})

app.get('/connect_indy', async(req,res)=>{
    const [trustAnchorDid, trustAnchorVerkey] = await didManager.getDID()
    const data = {
        msg: '블록체인 연결이 완료되었습니다',
        trustAnchorDid: trustAnchorDid,
        trustAnchorVerkey: trustAnchorVerkey
    }
    console.log(data)
    res.json(data)
})

app.get('/connect_indyG', async(req,res)=>{
    const [trustAnchorDid, trustAnchorVerkey] = await schemaManager.getDID()
    const data = {
        msg: '정부 블록체인 연결이 완료되었습니다',
        trustAnchorDid: trustAnchorDid,
        trustAnchorVerkey: trustAnchorVerkey
    }
    console.log(data)
    res.json(data)
})


app.get('/make_schema', async (req,res)=>{
    const [id, schema] = await makeSchema()
    const data = {
        msg: '스키마 생성이 완료되었습니다',
        schemaId: id,
        schema: schema
    }
    res.json(data)
})

app.get('/make_revoke_registry', async(req, res)=>{
    await makeRevokeRegistry()
    res.status(200).send('ok')
})

app.get('/make_credential', async(req, res)=>{
    const [credDefId, credDef] = await makeCredential() 
    const data = {
        msg: '출입증 Credential 생성에 성공했습니다',
        credDefId: credDefId,
        credDef: credDef
    }
    res.json(data)
})

app.listen(port, ()=>{
    console.log(`did manager server is running at http://localhost:${port}`)
})
