const mongoUtil = require('../config/database')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = async (req, res) => {
    var db = mongoUtil.getDb()
    try{
        const { email, password } = req.body
        encryptPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({
            email,
            password: encryptPassword,
            role: "user",
            userData: {
                firstName: undefined,
                lastName: undefined,
                displayName: email,
                registerData: Date.now(),
                unVerifiedEmail: true
            }
        }, (err, result) => {
            db.collection('unVerifiedEmail').insertOne({
                email,
                code: generateCode(),
                date: Date.now()
            })
        })
        res.status(201).send({
            message: "Register success"
        })
    } catch (err) {
        res.status(400).send({ message: "error", error: err.message })
    }
}

exports.signin = async (req, res) => {
    var db = mongoUtil.getDb()
    try{
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
                    role: userData.role
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "7d"
                }
            )
            res.status(200).send({
                message: "login success",
                token
            })
        } else {
            // no username found or password not match
            res.status(400).send({
                message: "Failed to login"
            }) 
        }
    }catch(err){
        res.status(400).send(err.message)
    }
}

function generateCode(){
    return Math.floor(Math.random() * (999999 - 100000) + 100000).toString()
}