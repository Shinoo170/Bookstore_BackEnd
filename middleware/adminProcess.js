const mongoUtil = require("../config/database")

exports.checkSeries = async (req, res, next) => {
    var db = mongoUtil.getDb()
    try {
        let data = await db.collection("series").findOne({
            title: req.body.title,
        })
        if (data) {
            return res.status(400).send({ message: "Duplicate series", })
        }
        next()
    } catch (err) {
        res.status(400).send({ message: "error to connect database", error: err.message })
    }
}