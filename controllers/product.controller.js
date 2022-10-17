const mongoUtil = require('../config/database')

exports.getAllSeries = async (req, res) => {
    try{
        const db = mongoUtil.getDb()
        await db.collection('series')
            .find({})
            .project({
                _id: 0,
                seriesId: 1,
                title: 1,
                img: 1,
                addDate: 1,
                lastUpdate: 1,
            }).toArray( (err, result) => {
                if(err) res.status(400).send({ message: 'Cannot connect to database'})
                res.send(result)
            })
    }catch(err){
        res.status(400).send({message: 'Error to get data', err})
    }
}

exports.getSeriesDetails = async (req, res) => {
    try{
        const params = req.params
        const db = mongoUtil.getDb()
        const seriesData = await db.collection('series').findOne({ seriesId: parseInt(params.seriesId) })
        const manga = await db.collection('products')
            .find({ _id: { $in: seriesData.products.mangaId} })
            .project({
                _id: 0,
                productId: 1,
                title: 1,
                url: 1,
                bookNum: 1,
                status: 1,
                price: 1,
                img: 1,
            }).toArray()
        const novel = await db.collection('products')
            .find({ _id: { $in: seriesData.products.novelId} })
            .project({
                _id: 0,
                productId: 1,
                title: 1,
                url: 1,
                bookNum: 1,
                status: 1,
                price: 1,
                img: 1,
            }).toArray()
        const other = await db.collection('products').find({ _id: { $in: seriesData.products.productId} }).limit(8).toArray()
        if(seriesData && manga && novel && other){
            res.status(200).send({seriesData,productData: { manga, novel, other}})
        } else {
            res.status(400).send({ message: 'No series found!' })
        }
    }catch(err){
        res.status(400).send({message: 'Error to get data', err})
    }
}

exports.getProduct = async (req, res) => {
    try{
        const params = req.params
        const db = mongoUtil.getDb()
        const data = await db.collection('products').findOne({ url: params.productURL})
        res.send(data)
    }catch(err){
        res.status(400).send({message: 'Error to get data', err})
    }
}

exports.getAllGenres = async (req, res) => {
    try{
        const db = mongoUtil.getDb()
        const array = []
        db.collection('keywords').find({}, { projection: { _id: 0, keyword: 1} }).toArray( (err, result) => {
            res.send( result )
        })
        
    } catch(err) {

    }
} 