const mongoUtil = require('../config/database')
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId

exports.checkEmail = async (req, res, next) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        let email = await db.collection('users').findOne({
            email: req.body.email
        })
        if(email){
            return res.status(400).send({
                message: "Failed! Email already in use!"
            })
        }
        next()
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.checkTel = async (req, res, next) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        let tel = await db.collection('users').findOne({
            _id: { $ne: _id },
            'userData.tel': req.body.t
        })
        if(tel){
            return res.status(400).send({
                message: "Failed! Tel number already in use!",
                code: 'tel_duplicate'
            })
        }
        next()
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}
