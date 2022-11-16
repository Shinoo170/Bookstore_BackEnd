const express = require('express')
const app = express()
const cors = require('cors')

require('dotenv').config()

// [ import all routes ]
const mongoUtil = require('./config/database')
const auth = require('./routes/auth.router')
const admin = require('./routes/admin.route')
const user = require('./routes/user.route')
const product = require('./routes/product.route')
const util = require('./routes/utility.route')

const corsOptions = {
    origin: '*',
    Credential: true
}

app.use(express.json())
app.use(cors(corsOptions))

app.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        message: "Server is running"
    })
})

// [ authorization system ]
app.use('/auth', auth)

// [ get products system ]
app.use('/product', product)

// [ admin system ]
app.use('/admin', admin)

// [ user system ]
app.use('/user', user)

// [ Utility system ]
app.use('/util', util)

const nodemailer = require('nodemailer');
app.get('/email' , (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
              user: 'ptbookshop@outlook.co.th', // your email
              pass: 'Pp13413416' // your email password
            }
        });
        let mailOptions = {
            from: 'ptbookshop@outlook.co.th',                // sender
            to: 'patrapong17@gmail.com',                // list of receivers
            subject: 'Hello from sender',              // Mail subject
            html: '<b>Do you receive this mail?</b>'   // HTML body
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if(err)
                res.send(err)
            else
              res.send("success")
         });
          
    } catch (err){
        res.send(err)
    }
    
})



const ethers = require('ethers')

app.post('/pay', async (req, res) => {
    try {
        const chain = EvmChain.BSC_TESTNET
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY, })
        const transaction = await Moralis.EvmApi.transaction.getTransaction({
            transactionHash: '0xe05c5152391a3c615df81e38e6f05eb1402cbaaa047f3cc1e101a1b31de82600',
            chain,
        })
        console.log(transaction.data.from_address)
        res.send(transaction)
    } catch (error) {
        console.log(error)
    }
})

const Moralis = require('moralis').default
const { EvmChain } = require('@moralisweb3/evm-utils')

app.get('/test', async (req, res) => {
    mongoUtil.connectToServer(async function(err, client){
        var db = mongoUtil.getDb()
        const testData = {
            name: 'pp',
            object: {
                id: 1
            },
            field1: 1,
            field2: 2,
        }
        await db.collection('test').insertOne(testData)
        
        await new Promise((resolve) => {
            setTimeout(resolve, 3000)
        })
        await db.collection('test').updateOne({name: 'pp'},{
            $set : {
                ['object.title']: 'คุณอาเรีย',
                field3: 3,
                field1: 'One',
            }
        })
    })
    res.send('ok')
})

module.exports = app;