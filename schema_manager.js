const indy = require('indy-sdk')
const util = require('./util')
const colors = require('./colors')
const axios = require('axios')

const log = console.log

let trustAnchorDid = ''
let trustAnchorVerkey = ''
let poolHandle = ''
let walletHandle = ''
let schemaId = ''
let credDefId = ''

function logValue() {
    log(colors.CYAN, ...arguments, colors.NONE)
}

function getDID(){
    return new Promise(async (resolve, reject)=>{
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
    const walletName = {"id": "schema_manager"}
    const walletCredentials = {"key": "schema_manager_key"}
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
    resolve([trustAnchorDid, trustAnchorVerkey])
    })
}

// 출입증 발급을 위한 스키마(Schema) 생성
function makeSchema(){   
    return new Promise(async (resolve, reject)=>{
        enterancePass = {
            'name': 'enterancePass',
            'version': '1.0',
            'attributes': ['firstName', 'lastName', 'passLevel']
        }
        log('스키마 생성...')
        const [id, schema] = await indy.issuerCreateSchema(trustAnchorDid, 'enterancePass', '1.0', ['firstName', 'lastName', 'passLevel'])
        schemaId = id
        log(id, schema)
        
        log('스키마 등록 요청 생성...')
        const schemaRequest= await indy.buildSchemaRequest(trustAnchorDid, schema)
        log('스키마 등록 요청 성공...')
        
        log('스키마 블록체인 노드에 등록 요청')
        const requestResult = await indy.signAndSubmitRequest(poolHandle, walletHandle, trustAnchorDid, schemaRequest)
        if(requestResult) log('스키마 블록체인 노드에 등록 성공')
        resolve([id, schema])
    })
}


function makeCredential(){
    log(trustAnchorDid, trustAnchorVerkey, poolHandle, walletHandle, schemaId, credDefId)
    return new Promise(async (resolve, reject)=>{
        log('스키마 요청 생성...')   
        const schemeRequest = await indy.buildGetSchemaRequest(trustAnchorDid, schemaId)
        log('스키마 요청...')
        const getSchemaResponse = await indy.signAndSubmitRequest(poolHandle, walletHandle, trustAnchorDid, schemeRequest)
        log('스키마 요청 응답 확인...')
        
        const [id, schema] = await indy.parseGetSchemaResponse(getSchemaResponse)

        log('CredDef 생성...')
        const [_credDefId, credDef] = await indy.issuerCreateAndStoreCredentialDef(walletHandle, trustAnchorDid, schema, 'TAG1', 'CL')
        credDefId = _credDefId
        log('CredDef 등록 요청 생성...')

        const credDefRequest = await indy.buildCredDefRequest(trustAnchorDid, credDef)
        log('CredDef 블록체인에 등록 요청...')
        const requestResult = await indy.signAndSubmitRequest(poolHandle, walletHandle, trustAnchorDid, credDefRequest)
        log('CredDef 블록체인에 등록 완료...')
        resolve([credDefId, credDef])
    })
}

function makeRevokeRegistry(){
    return new Promise(async(resolve, reject)=>{
        log('tails 파일 핸들러 생성')
        const tailsWriterHandle = await indy.openBlobStorageWriter('default', {'base_dir': '/tmp/indy_tails', 'uri_pattern': ''})
        
        log('revoc reg 생성')
        
        // const [revocRegId, revocRegDef, revocRegEntry] = await indy.issuerCreateAndStoreRevocReg(walletHandle, trustAnchorDid, 'CL_ACCUM', 'TAG1',  credDefId,
        //  config, tailsWriterHandle)
        // log(walletHandle, trustAnchorDid, 'CL_ACCUM', 'TAG1',  credDefId, config, tailsWriterHandle)
         await indy.issuerCreateAndStoreRevocReg(walletHandle, trustAnchorDid, 'CL_ACCUM', 'REG1', credDefId, {max_cred_num: 10000, issuance_type: 'ISSUANCE_ON_DEMAND'}, tailsWriterHandle)
        log('revoc reg 블록체인 등록 요청 생성')
        // const revocRequest = await indy.buildRevocRegDefRequest(trustAnchorDid, revocRegDef)
        // log('revoc reg 블록체인에 등록 요청 실행')
        // const requestResult1 = await indy.signAndSubmitRequest(poolHandle, walletHandle, trustAnchorDid, revocRequest)
        
        // log('revoc reg entry 요청 생성')
        // const revocEntryRequest = await indy.buildRevocRegEntryRequest(trustAnchorDid, revocRegId, 'CL_ACCUM', revocRegEntry)
        // log('revoc reg entry 요청 실행')
        // const requestResult2 = await indy.signAndSubmitRequest(poolHandle, walletHandle, trustAnchorDid, revocRequest)
        // log('revoc 등록 완료')    
        resolve()
    })
}






module.exports = {getDID, makeSchema, makeCredential, makeRevokeRegistry}