const indy = require('indy-sdk')
const util = require('./util')
const colors = require('./colors')
const axios = require('axios')

const log = console.log

let trustAnchorDid = ''
let trustAnchorVerkey = ''
let poolHandle = ''
let walletHandle = ''

function logValue() {
    log(colors.CYAN, ...arguments, colors.NONE)
}



// 출입증 발급을 위한 스키마(Schema) 생성
async function makeSchema(){
    
    enterancePass = {
        'name': 'enterancePass',
        'version': '1.0',
        'attributes': ['firstName', 'lastName', 'passLevel']
    }
    const [id, schema] = await indy.issuerCreateSchema(trustAnchorDid, 'enterancePass', '1.0', ['firstName', 'lastName', 'passLevel'])
    log(id, schema)
    
    log('스키마 등록 요청 생성...')
    const schemaRequest= await indy.buildSchemaRequest(trustAnchorDid, schema)
    log('스키마 등록 요청 성공...')
    
    const requestResult = await indy.signAndSubmitRequest(poolHandle, walletHandle, trustAnchorDid, schemaRequest)
    console.log(requestResult)
    
}

async function run(){
    
    console.log('steward did, verkey 불러오기')
    
    const response = await axios.get('http://localhost:3000')
    const {poolName, stewardDid, stewardVerkey} = response.data
    logValue(poolName, stewardDid, stewardVerkey)

    console.log('Indy Node 1.4 버전을 사용하기 위해 indy protocol을 2로 설정')
    await indy.setProtocolVersion(2)
    
    log('2. Open pool ledger and get handle from libindy')
    poolHandle = await indy.openPoolLedger(poolName, undefined)

    // 3.
    log('3. Creating new secure wallet')
    const walletName = {"id": "manager"}
    const walletCredentials = {"key": "manager"}
    await indy.createWallet(walletName, walletCredentials).catch(()=>{})

    // 4.
    log('4. Open wallet and get handle from libindy')
    walletHandle = await indy.openWallet(walletName, walletCredentials)

    log('6. Generating and storing trust anchor DID and verkey')
    // const didManagerSeed = 'DidManager'
    // const did = {'seed': didManagerSeed}
    const [_trustAnchorDid, _trustAnchorVerkey] = await indy.createAndStoreMyDid(walletHandle, "{}")
    trustAnchorDid = _trustAnchorDid
    trustAnchorVerkey = _trustAnchorVerkey

    logValue('Trust anchor DID: ', trustAnchorDid)
    logValue('Trust anchor Verkey: ', trustAnchorVerkey)
    
    // steward에게 trust anchor(endorser)로 등록해줄 것을 요청
    const data = {trustAnchorDid, trustAnchorVerkey}
    
    result = await axios.post('http://localhost:3000/request_endorser',  data)
    console.log(result.status)
}

module.exports = {run, makeSchema}