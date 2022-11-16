const mongoUtil = require("../config/database")

exports.checkSeries = async (req, res, next) => {
    var db = mongoUtil.getDb()
    try {
        let data = await db.collection("series").findOne({
            title: req.body.title,
        })
        if (data) {
            return res.status(400).send({ message: "ซีรีย์ซ้ำ", })
        }
        next()
    } catch (err) {
        res.status(400).send({ message: "error to connect database", error: err.message })
    }
}

exports.checkProduct = async (req, res, next) => {
    var db = mongoUtil.getDb()
    try{
        const { title, bookNum, category, thai_category } = req.body
        var url = title.trim().replaceAll(" ","-")
            if(category === 'novel' || category === 'manga'){
                url += '-เล่ม-' + bookNum + '-' + thai_category
            }else{
                url +=  '-' + bookNum + '-สินค้า'
            }
        const data = await db.collection('products').findOne({url})
        if(data) return res.status(400).send({message: 'ชื่อสินค้าซ้ำ',})
        next()
    } catch (err) {
        res.status(400).send({ message: "error to connect database", error: err.message })
    }
}