const mongoUtil = require('../config/database')

exports.getAllProduct = async (req, res) => {
    try{
        const db = mongoUtil.getDb()
        await db.collection('series').find( {}, {
            projection: { 
                _id: 0,
                seriesId: 1,
                title: 1,
                img: 1
            }
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
        const data = await db.collection('series').findOne({ seriesId: parseInt(params.seriesId) })
        if(data){
            res.status(200).send(data)
        } else {
            res.status(400).send({ message: 'No series found!' })
        }
    }catch(err){
        res.status(400).send({ err: err.message })
    }
}