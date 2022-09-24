const jwt = require('jsonwebtoken')

exports.verifyToken = async (req, res, next) => {
    const token = req.headers['jwt']
    if(!token){
        return res.status(403).send({ message: "No token!" })
    }
    try{
        jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: "Unauthorized!" })
            }
            req.user_id = decoded.user_id
            req.role = decoded.role
            next()
        })
    }catch(err){
        res.status(401).send({
            message: err.message
        })
    }
}
