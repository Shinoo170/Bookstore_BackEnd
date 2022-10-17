const mongoUtil = require('../config/database')

exports.checkEmail = async (req, res, next) => {
    try{
        var db = mongoUtil.getDb()
        let email = await db.collection('users').findOne({
            email: req.body.email
        })
        if(email){
            return res.status(400).send({
                message: "Failed! Email already in use!"
            })
        }
        next()
    }catch(err){
        return res.status(500).send({ message: err.message })
    }
}
