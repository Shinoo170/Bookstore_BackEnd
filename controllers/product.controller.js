// [ connect to database ]
const mongoUtil = require('../config/database')
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId

exports.getAllSeries = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const result = await db.collection('series')
            .find({ status: { $ne: 'delete' } })
            .project({
                _id: 0,
                seriesId: 1,
                title: 1,
                author: 1,
                illustrator: 1,
                publisher: 1,
                genres: 1,
                img: 1,
                score: 1,
                addDate: 1,
                lastModify: 1,
                status: 1,
                products: {
                    totalManga: 1,
                    totalNovel: 1,
                    totalOther: 1,
                }
            }).toArray()
        res.send(result)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getSeriesDetails = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const params = req.params
        const seriesData = await db.collection('series').findOne({ seriesId: parseInt(params.seriesId), status: { $ne: 'delete' }  }, {
            projection: {
                _id: 0,
                cosineSimilarity: 0,
                subscribe: 0,
            }
        })
        if(!seriesData){
            res.status(400).send({ message: 'No series found!' })
        }
        const manga = await db.collection('products')
            .find({ _id: { $in: seriesData.products.mangaId } })
            .project({
                _id: 0,
                productId: 1,
                seriesId: 1,
                title: 1,
                url: 1,
                bookNum: 1,
                category: 1,
                thai_category: 1,
                status: 1,
                price: 1,
                score: 1,
                img: 1,
                amount: 1,
            }).limit(8).toArray()
        const novel = await db.collection('products')
            .find({ _id: { $in: seriesData.products.novelId } })
            .project({
                _id: 0,
                productId: 1,
                seriesId: 1,
                title: 1,
                url: 1,
                bookNum: 1,
                category: 1,
                thai_category: 1,
                status: 1,
                price: 1,
                score: 1,
                img: 1,
                amount: 1,
            }).limit(8).toArray()
        const other = await db.collection('products').find({ _id: { $in: seriesData.products.otherId} }).limit(8).toArray()
        
        res.status(200).send({seriesData, productData: { manga, novel, other} })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getProductInSeries = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const query = req.query
        const target = query.category.toLowerCase() + 'Id'
        const listProductId = await db.collection('series').findOne({seriesId: parseInt(query.seriesId), status: { $ne: 'delete' } },{
            projection: {
                _id:0,
                products: { [target]: 1 }
            }
        })
        const data = await db.collection('products').find({ _id: {
            $in: Object.values(listProductId.products)[0]
        }}).project({
            _id: 0
        }).toArray()
        res.status(200).send(data)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getProduct = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const params = req.params
        const query = req.query
        const target = query.category.toLowerCase() + 'Id'
        const productDetails = await db.collection('products').findOne({ url: params.productURL, status: { $ne: 'delete' } })
        if( !productDetails ){
            return res.status(404).send() 
        }
        var seriesDetails = await db.collection('series').findOne({ seriesId: parseInt(query.seriesId)},{
            projection: {
                _id: 0,
                title: 1,
                author: 1,
                illustrator: 1,
                publisher: 1,
                genres: 1,
                cosineSimilarity: { $slice: 10 },
                products: { [target]: 1 }
            }
        })
        
        const otherProducts = await db.collection('products').find({ 
            _id : { $in: Object.values(seriesDetails.products)[0] },
            url: { $ne: params.productURL} 
        }).project({
            _id: 0
        }).limit(10).toArray()

        const similarProducts = await db.collection('series').find({ 
            seriesId : { $in: seriesDetails.cosineSimilarity.map(e => e.seriesId) },
        }).project({
            _id: 0,
            seriesId: 1,
            title: 1,
            img: 1,
            status: 1,
            score: 1,
        }).limit(10).toArray()

        res.status(200).send({productDetails, seriesDetails, otherProducts , similarProducts})
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getProductLessData = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const params = req.params
        const query = req.query
        const productDetails = await db.collection('products').findOne({ url: params.productURL })

        const seriesDetails = await db.collection('series').findOne({ seriesId: parseInt(query.seriesId)},{
            projection: {
                _id: 0,
                title: 1,
            }
        })
        if( productDetails === null ) res.status(404).send()
        else {
            productDetails.seriesTitle = seriesDetails.title
            res.status(200).send(productDetails)
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getLatestSeries = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const data = await db.collection('series').find({ status: { $ne: 'delete' } }).project({
            _id: 0,
            seriesId: 1,
            title: 1,
            author: 1,
            illustrator: 1,
            publisher: 1,
            genres: 1,
            img: 1,
            score: 1,
            addDate: 1,
            lastModify: 1,
            status: 1,
            products: {
                totalManga: 1,
                totalNovel: 1,
                totalOther: 1,
            },
            sold: 1,
        }).sort({lastModify: -1}).toArray()
        if(data){
            res.status(200).send(data)
        }else{
            res.status(400).send({message: 'No product found!', err})
        } 
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getLatestProduct = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const data = await db.collection('products').find({ status: { $ne: 'delete' } }).limit(10).sort({productId: -1}).toArray()
            if(data){
                res.status(200).send(data)
            }else{
                res.status(400).send({message: 'No product found!', err})
            }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getMostSoldProduct = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const data = await db.collection('products').find({ status: { $ne: 'delete' } }).limit(10).sort({sold: -1}).toArray()
        if(data){
            res.status(200).send(data)
        }else{
            res.status(400).send({message: 'No product found!', err})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getPreOrderProduct = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const data = await db.collection('products').find({ status: 'preOrder' }).sort({addDate: -1}).toArray()
        if(data){
            res.status(200).send(data)
        }else{
            res.status(400).send({message: 'No product found!', err})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

// Genres
exports.getAllGenres = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const data = await db.collection('globalData').findOne({ field: 'genres'}, { projection: { _id: 0, data: 1}})
        res.send( data.data.sort() )
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

// Subscribe
exports.isUserSubscribe = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const seriesId = parseInt(req.query.seriesId)
        const user_id = new ObjectId(req.user_id)
        const data = await db.collection('series').findOne({ seriesId, subscribe: user_id }, { projection: { _id:0, seriesId:1 }})
        if(data){
            res.status(200).send(true)
        } else {
            res.status(200).send(false)
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.addSubscriber = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const seriesId = parseInt(req.query.seriesId)
        const _id = new ObjectId(req.user_id)
        const seriesSubscribe = await db.collection('series').updateOne({ seriesId }, {
            $push: {
                subscribe: _id
            }
        })
        const userSubscribe = await db.collection('users').updateOne({ _id }, {
            $push: {
                subscribe: seriesId,
            }
        })
        if(seriesSubscribe.modifiedCount === 1 && userSubscribe.modifiedCount === 1){
            res.status(201).send(true)
        } else {
            res.status(500).send({message: 'Cannot subscribe', err})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.removeSubscriber = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const seriesId = parseInt(req.query.seriesId)
        const _id = new ObjectId(req.user_id)
        const seriesSubscribe = await db.collection('series').updateOne({ seriesId }, {
            $pull: {
                subscribe: _id,
            }
        })
        const userSubscribe = await db.collection('users').updateOne({ _id }, {
            $pull: {
                subscribe: seriesId,
            }
        })
        if(seriesSubscribe.modifiedCount > 0 && userSubscribe.modifiedCount > 0){
            res.status(201).send(false)
        } else {
            res.status(500).send({message: 'Cannot subscribe'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

// wishlists
exports.isUserWishlist = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const productId = parseInt(req.query.productId)
        const user_id = new ObjectId(req.user_id)
        const data = await db.collection('products').findOne({ productId, wishlists: user_id }, { projection: { _id:0, productId:1 }})
        if(data){
            res.status(200).send(true)
        } else {
            res.status(200).send(false)
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.addWishlist = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const productId = parseInt(req.query.productId)
        const _id = new ObjectId(req.user_id)
        const productWishlists = await db.collection('products').updateOne({ productId }, {
            $push: {
                wishlists: _id
            }
        })
        const userWishlists = await db.collection('users').updateOne({ _id }, {
            $push: {
                wishlists: productId,
            }
        })
        if(productWishlists.modifiedCount === 1 && userWishlists.modifiedCount === 1){
            res.status(201).send(true)
        } else {
            res.status(500).send({message: 'Cannot add to wishlists'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.removeWishlist = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const productId = parseInt(req.query.productId)
        const _id = new ObjectId(req.user_id)
        const productWishlists = await db.collection('products').updateOne({ productId }, {
            $pull: {
                wishlists: _id
            }
        })
        const userWishlists = await db.collection('users').updateOne({ _id }, {
            $pull: {
                wishlists: productId,
            }
        })
        if(productWishlists.modifiedCount > 0 && userWishlists.modifiedCount > 0){
            res.status(201).send(false)
        } else {
            res.status(500).send({message: 'Cannot remove from wishlists'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.review = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { productId, review, score } = req.body
        const _id = new ObjectId(req.user_id)
        await db.collection('review').insertOne({
            productId,
            user_id: _id,
            review,
            score
        })
        res.status(201).send({message: 'review success'})

        const product = await db.collection('products').findOne({productId}, {
            projection: {
                _id: 0,
                seriesId: 1,
                score: 1
            }
        })
        const series = await db.collection('series').findOne({seriesId: product.seriesId}, {
            projection: {
                _id: 0,
                score: 1
            }
        })
        const productAvg = Math.round(((product.score.avg * product.score.count) + score) / (product.score.count +1) *100)/100
        const seriesAvg = Math.round(((series.score.avg * series.score.count) + score) / (series.score.count +1) *100)/100
        await db.collection('products').updateOne({productId}, {
            $set : { 'score.avg' : productAvg },
            $inc: { 'score.count': 1 }
        })
        await db.collection('series').updateOne({seriesId: product.seriesId}, {
            $set : { 'score.avg' : seriesAvg },
            $inc: { 'score.count': 1 }
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getReview = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const pid = req.query.productId
        const data = await db.collection('review').aggregate([{
                $match: {productId: parseInt(pid)}
            },{
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'detail'
                }
            },{
                $project: {
                    "_id": 1,
                    "user_id": 1,
                    "review": 1,
                    "productId": 1,
                    "score": 1,
                    "detail.userData.displayName": 1,
                    "detail.userData.img": 1,
                }
            }])
            .toArray()
        res.send(data)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.deleteReview = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.query.reviewId)
        const user_id = new ObjectId(req.user_id)
        await db.collection('review').deleteOne({ _id, user_id })

        res.status(200).send('success')

        const product = await db.collection('products').findOne({productId: parseInt(req.query.productId)}, {
            projection: {
                _id: 0,
                score: 1
            }
        })
        const series = await db.collection('series').findOne({seriesId: parseInt(req.query.seriesId)}, {
            projection: {
                _id: 0,
                score: 1
            }
        })
        const score = parseInt(req.query.score)
        var productAvg
        var seriesAvg
        if(product.score.count > 1){
            productAvg = Math.round(((product.score.avg * product.score.count) - score) / (product.score.count - 1) *100)/100
        } else {
            // divide by 0 is infinity
            productAvg = 0
        }
        if(series.score.count > 1){
            seriesAvg = Math.round(((series.score.avg * series.score.count) - score) / (series.score.count - 1) *100)/100
        } else {
            // divide by 0 is infinity
            seriesAvg = 0
        }
        await db.collection('products').updateOne({productId: parseInt(req.query.productId)}, {
            $set : { 'score.avg' : productAvg },
            $inc: { 'score.count': -1 }
        })
        await db.collection('series').updateOne({seriesId: parseInt(req.query.seriesId)}, {
            $set : { 'score.avg' : seriesAvg },
            $inc: { 'score.count': -1 }
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}


// const client = new MongoClient(process.env.MONGODB_URI)
// try{
//     await client.connect()
//     const db = client.db(process.env.DB_NAME)

// } catch (err) {
//     console.log(err)
//     res.status(500).send({message: 'This service not available', err})
// } finally {
//     await client.close()
// }
