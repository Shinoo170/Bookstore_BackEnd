const jwt = require('jsonwebtoken')

exports.verifyToken = async (req, res, next) => {
    const token = req.headers['jwt'] || req.body.jwt
    if(!token){
        return res.status(403).send({ message: "No token!" })
    }
    try{
        jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
            if (err) {
                // Expire or Invalid
                console.log(err.message)
                return res.status(401).send({ message: "Unauthorized!", error: err.message })
            }
            req.user_id = decoded.user_id
            req.email = decoded.email
            req.role = decoded.role
            next()
        })
    }catch(err){
        res.status(401).send({
            message: err.message
        })
    }
}

exports.isAdmin = async (req, res, next) => {
    const token = req.headers['jwt'] || req.body.jwt
    if(!token){
        return res.status(403).send({ message: "No token!" })
    }
    try{
        jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
            if (err) {
                // Expire or Invalid
                console.log(err.message)
                return res.status(401).send({ message: "Unauthorized!", error: err.message })
            }
            if(decoded.role === 'admin'){
                next()
            } else {
                return res.status(401).send({ message: "Unauthorized!"})
            }
        })
    }catch(err){
        res.status(401).send({
            message: err.message
        })
    }
}
