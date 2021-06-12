const path = require('path')
const express = require('express')
const app = express()
const util = require('./util.js')

const server = require('http').createServer(app)
const io = require('socket.io')(server)
app.set('io', io)

const ejs = require('ejs')
const port = 3001

// 1. ledger에 등록된 did를 verinym 이라고 한다
// 2. legder에 등록된 did를 확인하기 위한 과정을 verinym transaction이라고 한다

app.use(express.json())
app.use(express.urlencoded())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile);

const didManager = require('./did_manager.js')
const schemaManager = require('./schema_manager.js')

app.get('/page', (req,res)=>{
    res.render('index.html')
})

app.get('/test', (req,res)=>{
    res.send(util.encode(100))
})

app.get('/', (req,res)=>{
    res.send('ok')
})

app.get('/connect_indy', async(req,res)=>{
    const [trustAnchorDid, trustAnchorVerkey] = await didManager.getDID(io)
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
    const [id, schema] = await didManager.makeSchema()
    const data = {
        msg: '스키마 생성이 완료되었습니다',
        schemaId: id,
        schema: schema
    }
    res.json(data)
})

app.get('/make_credential', async(req, res)=>{
    const [credDefId, credDef] = await didManager.makeCredential() 
    const data = {
        msg: '출입증 Credential 생성에 성공했습니다',
        credDefId: credDefId,
        credDef: credDef
    }
    res.json(data)
})

app.get('/make_revoke_registry', async(req, res)=>{
    await didManager.makeRevokeRegistry()
    res.status(200).send('ok')
})

app.get('/make_enterance_VC', async(req, res)=>{
    let data = await didManager.makeEnteranceVC()
    data = {msg: 'VC 발급에 성공하였습니다', ...data}
    res.json(data)
})

io.on('connection', (socket)=>{
    console.log('소켓이 연결되었습니다')
    // val = 0
    // setInterval(()=>{
    //     socket.emit('msg', val++)
    // }, 1000)
})

server.listen(port, ()=>{
    console.log(`did manager server is running at http://localhost:${port}`)
})
