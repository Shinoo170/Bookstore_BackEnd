// [ connect to database ]
const mongoUtil = require('../config/database')

const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { email, password } = req.body
        // const omiseCustomer = await createOmiseCustomer(email)
        const encryptPassword = await bcrypt.hash(password, 10)
        const displayName = email.split('@')
        const register =  await db.collection('users').insertOne({
            email,
            password: encryptPassword,
            role: "user",
            userData: {
                firstName: undefined,
                lastName: undefined,
                displayName: displayName[0],
                registerData: Date.now(),
                unVerifiedEmail: true,
                img: undefined,
            },
            cart: {
                list: [],
                created: Date.now(),
                expired: Date.now() + 7*24*60*60*1000   // 7 days
            },
            order: [],
        })
        await db.collection('unVerifiedEmail').insertOne({
            email,
            code: generateCode(),
            date: Date.now()
        })
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
            { phone: user }
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

exports.SendVerifyCode = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        let { email } = req.body
        let findEmail = await db.collection('users').findOne({
            email: req.body.email
        })
        if( findEmail ){
            await db.collection('unVerifiedEmail').findOneAndUpdate(
                { email },
                { code: generateCode(), date: Date.now() },
            )
            res.status(200).send({ message: 'send success'})
        } else {
            await db.collection('unVerifiedEmail').insertOne({
                email,
                code: generateCode(),
                date: Date.now()
            })
            res.status(200).send({ message: 'send success'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}
