const mongoUtil = require("../config/database")
const { MongoClient } = require('mongodb')

exports.checkSeries = async (req, res, next) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        let data = await db.collection("series").findOne({
            title: req.body.title,
        })
        if (data) {
            return res.status(400).send({ message: "ชื่อซีรีย์ซ้ำ", })
        }
        next()
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.checkProduct = async (req, res, next) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
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
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.checkProductName = async (req, res, next) => {
    if(req.body.isUrlChange){
        const client = new MongoClient(process.env.MONGODB_URI)
        try{
            await client.connect()
            const db = client.db(process.env.DB_NAME)
            const { title, bookNum, category, thai_category } = req.body
            var url = title.trim().replaceAll(" ","-")
            if(category === 'novel' || category === 'manga'){
                url += '-เล่ม-' + bookNum + '-' + thai_category
            }else{
                url +=  '-' + bookNum + '-สินค้า'
            }
            const data = await db.collection('products').findOne({url})
            if(data) return res.status(400).send({message: 'ชื่อสินค้าซ้ำ',})
            req.body.newUrl = url
            next()
        } catch (err) {
            console.log(err)
            return res.status(500).send({message: 'This service not available', err})
        } finally {
            await client.close()
        }
    } else {
        next()
    }
}