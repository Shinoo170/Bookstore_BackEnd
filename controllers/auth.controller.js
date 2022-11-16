// [ connect to database ]
const mongoUtil = require('../config/database')
mongoUtil.connectToServer(function(err, client){
    if (err) console.log(err);
})

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
var omise = require('omise')({
    'publicKey': process.env.OMISE_PUBLIC_KEY,
    'secretKey': process.env.OMISE_SECRET_KEY
})

const createOmiseCustomer = async (email) => {
    const customer = await omise.customers.create({
        email,
        'description': `email : ${email}`,
    })
    return customer
}

exports.signup = async (req, res) => {
    var db = mongoUtil.getDb()
    try{
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
                unVerifiedEmail: true,
                img: undefined,
            },
            cart: {
                list: [],
                created: Date.now(),
                expired: Date.now() + 7*24*60*60*1000   // 7 days
            },
            order: [],
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

exports.signIn = async (req, res) => {
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
                name: userData.userData.displayName,
            })
        } else {
            // no username found or password not match
            res.status(400).send({
                message: "Failed to login",
                error: "Username or password not match"
            })
        }
    }catch(err){
        res.status(400).send({
            message: 'error',
            error: err.message
        })
    }
}

function generateCode(){
    return Math.floor(Math.random() * (999999 - 100000) + 100000).toString()
}

exports.SendVerifyCode = async (req, res) => {
    let { email } = req.body
    var db = mongoUtil.getDb()
    let findEmail = await db.collection('users').findOne({
        email: req.body.email
    })
    if( findEmail ){
        db.collection('unVerifiedEmail').findOneAndUpdate(
            { email },
            { code: generateCode(), date: Date.now() },
            function( err, result ){
                if (err){
                    res.status(400).send({
                        message: 'Cannot send verify code',
                        error: err.message
                    })
                }
                res.status(200).send({ message: 'send success'})
            })
    } else {
       db.collection('unVerifiedEmail').insertOne({
            email,
            code: generateCode(),
            date: Date.now()
        }, function( err, result){
            if (err){
                res.status(400).send({
                    message: 'Cannot send verify code',
                    error: err.message
                })
            }
            res.status(200).send({ message: 'send success'})
        }) 
    }
    
}