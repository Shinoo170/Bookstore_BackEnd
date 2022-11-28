// [ connect to database ]
const mongoUtil = require('../config/database')

const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
let sendMail = require('@sendgrid/mail')
sendMail.setApiKey(process.env.MAIL_API_KEY)

exports.signup = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { email, password } = req.body
        // const omiseCustomer = await createOmiseCustomer(email)
        const encryptPassword = await bcrypt.hash(password, 10)
        const displayName = email.split('@')
        await db.collection('users').insertOne({
            email,
            password: encryptPassword,
            role: "user",
            userData: {
                firstName: undefined,
                lastName: undefined,
                displayName: displayName[0],
                registerData: Date.now(),
                verifiedEmail: false,
                img: undefined,
                tel: undefined,
            },
            cart: {
                list: [],
                created: Date.now(),
                expired: Date.now() + 7*24*60*60*1000   // 7 days
            },
            order: [],
            subscribe: [],
            wishlists: [],
        })
        
        const verifyCode = randomString(10)
        const token = jwt.sign(
            {
                email,
                code: verifyCode,
            },
            process.env.TOKEN_KEY,
            {
                // expiresIn: "7d"
            }
        )
        await db.collection('unVerifiedEmail').insertOne({
            email,
            code: verifyCode,
            date: Date.now()
        })
        sendEmail(email, token)
        res.status(201).send({
            message: "Register success"
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.signIn = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        let { user, password } = req.body
        // login by Email or Phone number
        let userData = await db.collection('users').findOne( {$or: [
            { email: user },
            { 'userData.tel': user }
        ]})
        // check password
        if( userData && (await bcrypt.compare(password, userData.password)) ){
            const token = jwt.sign(
                {
                    user_id: userData._id,
                    email: userData.email,
                    role: userData.role
                },
                process.env.TOKEN_KEY,
                {
                    // expiresIn: "7d"
                }
            )
            res.status(200).send({
                message: "login success",
                token,
                userId: userData._id,
                img: userData.userData.img,
                name: userData.userData.displayName,
            })
        } else {
            // no username found or password not match
            res.status(400).send({
                message: "Failed to login",
                error: "Username or password not match"
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

function generateCode(){
    return Math.floor(Math.random() * (999999 - 100000) + 100000).toString()
}

function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function sendEmail(email, token){
    const url = process.env.FRONTEND_URL + '/verifyEmail?token=' + token
    const msg = {
        to: email,
        from: {
            email: 'ptbookstore@outlook.com', //email ผู้ส่ง
            name: 'PT Bookstore' // ชื่อผู้ส่ง
        },
        templateId: 'd-e63dcd9b1bee4caca1ba68e944ed7fdc', //code template ดูได้ที่ https://mc.sendgrid.com/dynamic-templates
        dynamicTemplateData:{ //ชื่อตัวแปรในแต่ละ template
            link_verifired: url
        }
    }
    sendMail.send(msg).then(response => { }).catch(error => console.log(error.massage))
}


exports.SendVerifyCode = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { email } = req.body
        const verifyCode = randomString(10)
        let findEmail = await db.collection('users').findOne({
            // $and: [ {email: req.body.email}, {'userData.verifiedEmail': false} ]
            email: req.body.email,
            'userData.verifiedEmail': false
        }, { projection: {
            _id: 0,
            email: 1,
        }})
        if( findEmail ){
            const result = await db.collection('unVerifiedEmail').findOneAndUpdate(
                { email },
                { $set: { code: verifyCode, date: Date.now() } },
            )
            const token = jwt.sign(
                {
                    email,
                    code: verifyCode,
                },
                process.env.TOKEN_KEY,
                {
                    // expiresIn: "7d"
                }
            )
            sendEmail(email, token)
            if(result.value){
                res.status(200).send({ message: 'send success'})
            } else {
                await db.collection('unVerifiedEmail').insertOne({
                    email,
                    code: verifyCode,
                    date: Date.now() 
                })
                res.status(200).send({ message: 'send success'})
            }
        } else {
            res.status(400).send({ message: 'This email already verify' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.verifyEmail = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    const { token } = req.body
    if(!token){
        return res.status(403).send({ message: "No token!", thai_message: 'ไม่พบ Token', code: 'invalid_token'})
    }
    jwt.verify(token, process.env.TOKEN_KEY, async (err, decoded) => {
        if (err) {
            // Expire or Invalid
            console.log(err.message)
            return res.status(401).send({ message: "Invalid token!", error: err.message, thai_message: 'Token ไม่ถูกต้อง', code: 'invalid_token'})
        }
        const email = decoded.email
        const code = decoded.code
        try{
            await client.connect()
            const db = client.db(process.env.DB_NAME)
            const cursor = await db.collection('unVerifiedEmail').findOneAndDelete({email, code})
            if(cursor.value){
                res.status(200).send({message: 'Email has been verified'})
                await db.collection('users').updateOne({email: email}, {
                    $set: {
                        'userData.verifiedEmail': true
                    }
                })
            } else {
                res.status(400).send({message: 'Email already verified', thai_message: 'อีเมลนี้ยืนยันแล้ว', code: 'already_verify'})
            }
        } catch (err) {
            console.log(err)
            res.status(500).send({message: 'This service not available', err, thai_message: 'ระบบปิดให้บริการ', code: 'server_error'})
        } finally {
            await client.close()
        }
    })
    
}
