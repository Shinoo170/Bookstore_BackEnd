const mongoUtil = require('../config/database')
const { MongoClient } = require('mongodb')

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
        // await client.close()
    }
}
