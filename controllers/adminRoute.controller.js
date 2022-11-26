
const mongoUtil = require('../config/database')

const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const Moralis = require('moralis').default
const { EvmChain } = require('@moralisweb3/evm-utils')


exports.addProduct = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { seriesId, title, bookNum, category, thai_category, description, status, price, amount, img } = req.body
        const productId = await mongoUtil.getNextSequence(db, 'productId')
        
        var url = title.trim().replaceAll(" ","-")
        if(category === 'novel' || category === 'manga'){
            url += '-เล่ม-' + bookNum + '-' + thai_category
        } else {
            url +=  '-' + bookNum + '-สินค้า'
        }
        const date = Date.now()
        const newData = {
            seriesId,
            productId,
            title: title.trim(),
            url,
            bookNum: bookNum,
            category,
            thai_category,
            description,
            status,
            price: parseInt(price),
            amount: parseInt(amount),
            img,
            score: { avg:0 , count:0 },
            addDate: date,
            lastModify: date,
            sold: 0,
            population: 0,
            wishlists: [],
        }
        const newProduct = await db.collection('products').insertOne(newData)
        const target = "products.total" + category.charAt(0).toUpperCase() + category.slice(1)
        const addIdTarget = "products." + category + "Id"
        const seriesData = await db.collection('series').findOneAndUpdate({seriesId: parseInt(seriesId)}, {
            $inc: {
                "products.totalProducts": 1,
                [target]: 1,
            },
            $push: {
                [addIdTarget]: newProduct.insertedId,
            },
            $set: {
                lastAddProduct: date,
                lastModify: date,
            }
        }, {
            projection: {
                _id: 0,
                subscribe: 1,
            }
        })
        res.status(201).send({
            message: "Add product success",
        })

        // Notify to subscriber
        const subscriber = seriesData.value.subscribe
        const subscriber_email = await db.collection('users').find({ _id: { $in: subscriber} }).project({ _id:0, email: 1}).toArray()
        console.log(subscriber_email)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.changeProductData = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { seriesId, url,category, thai_category, status, price, amount, description, isImageChange, isCategoryChange, isUrlChange } = req.body
        const date = Date.now()
        const updateData = {
            status,
            price,
            amount,
            description,
            lastModify: date
        }
        var targetUrl = url
        if(isUrlChange){
            updateData.title = req.body.title
            updateData.bookNum = req.body.bookNum
            updateData.url = req.body.newUrl
            targetUrl = req.body.newUrl
        }
        if(isImageChange) {
            // Delete old image
            updateData.img = req.body.listImgURL
            const listImg = await db.collection('products').findOne({ url }, {
                projection: {
                    _id: 0,
                    img: 1,
                }
            })
            const targetImg = listImg.img
            const aws = require('aws-sdk')
            aws.config.update({
                secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
                accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                region: process.env.AWS_S3_REGION,
            })
            const s3 = new aws.S3()
            targetImg.forEach(async filePath => {
                const removePath = process.env.AWS_S3_URL + '/'
                const key = filePath.replaceAll(removePath, '')
                await s3.deleteObject({ 
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: key 
                }).promise()
            })
        }
        if(isCategoryChange){
            updateData.category = category
            updateData.thai_category = thai_category
        }
        await db.collection('products').updateOne({url},{
            $set: updateData
        })
        if(isCategoryChange){
            const _id = new ObjectId(req.body.id)
            var previousTotalTarget = 'products.total' + req.body.previousCategory.charAt(0).toUpperCase() + req.body.previousCategory.slice(1)
            var previousTargetId = 'products.' + req.body.previousCategory + 'Id'
            var TotalTarget = 'products.total' + category.charAt(0).toUpperCase() + category.slice(1)
            var TargetId = 'products.' + category + 'Id'
            await db.collection('series').updateOne({seriesId: parseInt(seriesId)}, {
                $inc: {
                    [previousTotalTarget]: -1,
                    [TotalTarget]: 1,
                },
                $push: {
                    [TargetId]: _id,
                },
                $pull : {
                    [previousTargetId]: _id,
                },
                $set: {
                    lastModify: date
                }
            })
        }

        await db.collection('products').updateOne({ url }, {
            $set: updateData
        })
        res.status(201).send({
            message: "update product success",
            url: targetUrl,
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.deleteProduct = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const listImg = await db.collection('products').findOne({ productId: parseInt(req.query.productId) }, {
            projection: {
                _id: 0,
                img: 1,
            }
        })
        const targetImg = listImg.img
        await db.collection('products').deleteOne({ productId: parseInt(req.query.productId) })
        const aws = require('aws-sdk')
        aws.config.update({
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            region: process.env.AWS_S3_REGION,
        })
        const s3 = new aws.S3()
        targetImg.forEach(async filePath => {
            const removePath = process.env.AWS_S3_URL + '/'
            const key = filePath.replaceAll(removePath, '')
            await s3.deleteObject({ 
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key 
            }).promise()
        })
        const date = Date.now()
        const _id = new ObjectId(req.query._id)
        var TotalTarget = 'products.total' + req.query.category.charAt(0).toUpperCase() + req.query.category.slice(1)
        var TargetId = 'products.' + req.query.category + 'Id'
        await db.collection('series').updateOne({seriesId: parseInt(req.query.seriesId) }, {
            $inc: {
                'products.totalProducts': -1,
                [TotalTarget]: -1,
            },
            $pull : {
                [TargetId]: _id,
            },
            $set: {
                lastModify: date
            }
        })

        res.status(200).send('success')
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.addSeries = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { title, author, illustrator, publisher, genres, keywords, img } = req.body
        const description = req.body.description === 'undefined'? undefined : req.body.description
        const date = Date.now()

        const seriesId = await mongoUtil.getNextSequence(db, 'seriesId')
        await db.collection('series').insertOne({
            seriesId,
            title: title.trim(),
            author: author.trim(),
            illustrator: illustrator.trim(),
            publisher: publisher.trim(),
            description,
            genres,
            keywords,
            img,
            score: { avg:0 , count:0 },
            addDate: date,
            lastAddProduct: date,
            lastModify: date,
            status: 'available',
            products: {
                totalProducts: 0,
                totalManga: 0,
                totalNovel: 0,
                totalOther: 0,
                priceRange: { all:[], manga:[], novel:[], product:[] },
                lastModify: { manga: date, novel: date, other: date },
                mangaId: [],
                novelId: [],
                otherId: [],
            },
            subscribe: [],
        })
        res.status(201).send({
            message: "Add series success",
        })
        await calculateCos(db)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }

}

exports.changeSeriesData = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { seriesId, title, author, illustrator, publisher, genres, keywords, img, description, imgChange} = req.body
        const date = Date.now()
        await db.collection('series').updateOne({seriesId},{
            $set: {
                title: title.trim(),
                author: author.trim(),
                illustrator: illustrator.trim(),
                publisher: publisher.trim(),
                description,
                genres,
                keywords,
                img,
                lastModify: date,
            } 
        })
        if(imgChange.isImageChange){
            console.log(imgChange.previousImage)
        }
        res.status(201).send({
            message: "update series success",
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.reCalculateCos = async (req, res) => {
    try {
        const client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const counter = await db.collection('counters').findOne({_id: 'seriesId'})
        const productCounter = counter.seq - 1
        db.collection('series').find({}, {
            projection: {
                _id: 0,
                seriesId: 1,
                title: 1,
                keywords: 1,
            }
        }).toArray( async (err, result) => {
            const arr = [...result]
            // get cosineSimilarity
            const new_cosine_sim = Array(productCounter).fill().map(() => Array(productCounter))
            var cosine_sim

            for(let i=0; i<arr.length; i++){
                for(let j=i+1; j<arr.length; j++){
                    cosine_sim = cosineSimilarity(arr[i], arr[j])
                    new_cosine_sim[arr[i].seriesId-1][arr[j].seriesId-1] = cosine_sim
                    new_cosine_sim[arr[j].seriesId-1][arr[i].seriesId-1] = cosine_sim
                }
                new_cosine_sim[arr[i].seriesId-1][arr[i].seriesId-1] = 1
            }
            res.send(new_cosine_sim)
            db.collection('cosineTable').updateOne({name: 'origin'},{
                $set: {data: new_cosine_sim}
            })
            sortCosineTable(db, new_cosine_sim)
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
    
}

async function calculateCos(db){
    const cursor = await db.collection('series').find({}, {
        projection: {
            _id: 0,
            seriesId: 1,
            title: 1,
            keywords: 1,
        }
    }).toArray()

    const newSeriesId = cursor.length - 1
    if(newSeriesId == -1) { return }
    if(newSeriesId == 0){
        await db.collection('cosineTable').insertOne({
            name: 'origin',
            data: [[1]]
        })
        return
    }
    // get cosineSimilarity
    const data = await db.collection('cosineTable').findOne({name: 'origin'}, {projection: { _id: 0, data: 1 } })
    const new_cosine_sim = data.data

    new_cosine_sim.push([])
    for(let i=0; i<cursor.length-1; i++){
        const cosine_sim = cosineSimilarity(cursor[i], cursor[newSeriesId])
        new_cosine_sim[i].push(cosine_sim)
        new_cosine_sim[newSeriesId].push(cosine_sim)
    }
    new_cosine_sim[newSeriesId].push(1)
    await db.collection('cosineTable').updateOne({name: 'origin'},{
        $set: {data: new_cosine_sim}
    })
    await sortCosineTable(db, new_cosine_sim)
}

function cosineSimilarity(p1, p2){
    const [ product1, product2 ] = [ p1.keywords, p2.keywords ]
    const set = new Set()
    product1.forEach( data => {
        set.add(data)
    })
    product2.forEach( data => {
        set.add(data)
    })
    const data = Array.from(set)

    const [ p1Keyword, p2Keyword] = [ [],[] ]
    data.forEach( (element, index) => {
        if(product1.indexOf(element) > -1){
            p1Keyword[index] = 1
        } else {
            p1Keyword[index] = 0
        }
        if(product2.indexOf(element) > -1){
            p2Keyword[index] = 1
        } else {
            p2Keyword[index] = 0
        }
    })

    // formula of cosine similarity
    // cos(θ) = A•B / ( ||A|| ||B|| )
    // cos(θ) = ΣAiBi / ( sqrt(ΣAi^2) × sqrt(ΣBi^2) )
    // Σ start from i=0 to n
    // A = vector of product1 , B = vector of product2
    var [ AdotB, lengthA, lengthB ]= [0,0,0]
    for(let i=0; i<p1Keyword.length; i++){
        AdotB += p1Keyword[i] * p2Keyword[i]
        lengthA += p1Keyword[i]
        lengthB += p2Keyword[i]
    }
    const result = AdotB / (Math.sqrt(lengthA) * Math.sqrt(lengthB))
    return result
}

async function sortCosineTable(db, data){
    try {
        var newData = []
        data.forEach(async (element, index) => {
            var sort = {seriesId: index+1}
            var temp = []
            element.forEach((e, i) => {
                // Not include self product
                if(index != i)
                    temp.push({seriesId: i+1, value: e})
            })
            temp.sort((a, b) => {
                if ( a.value > b.value ){
                    return -1;
                }
                if ( a.value < b.value ){
                    return 1;
                }
                return 0;
            })
            sort.data = temp
            newData.push(sort)
            await db.collection('series').updateOne({seriesId: index+1},{
                $set: {
                    cosineSimilarity: temp
                }
            })
        })
        // var newData = JSON.stringify(newData)
        await db.collection('cosineTable').updateOne({name: 'sort'}, {
            $set: { data: newData }
        })
    } catch (error) {
        console.log(error)
    }
    
}

exports.addGenres = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const newGenres = req.body.newGenres
        await db.collection('globalData').updateOne({ field: 'genres'},{
            $push: {
                data: newGenres
            }
        })
        res.send('add success')
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getOrders = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)

        var status_sort = req.query.sort || 'all'
        var pages = req.query.pages || 1
        var pageLimit = 10
        var query = {}
        // if status = 'all' query condition = {}
        if(status_sort !== 'all'){
            query = { status: status_sort }
        }
        var sort = {'orderId': -1}
        if(status_sort === 'paid'){
            sort = { 'paymentDetails.created_at': 1 }
        }
        const order = await db.collection('orders').find(query).sort(sort).limit(pageLimit).skip((pages-1) * pageLimit).toArray()
        res.status(200).send(order)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getAllOrders = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const order = await db.collection('orders').find().sort({ 'orderId': -1 }).toArray()
        res.status(200).send(order)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getPaidOrder = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const order = await db.collection('orders').find({status: { $in: ['paid'] }}).sort({ 'paymentDetails.created_at': 1}).toArray()
        res.status(200).send(order)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.getOrderDetails = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const orderId = req.query.orderId
        const order = await db.collection('orders').findOne({ orderId: parseInt(orderId) })
        var productIdList = order.cart.map(element => { return element.productId })
        var productDetails = await db.collection('products').find({ productId: { $in: productIdList }
        }).project({
            _id: 0,
            seriesId: 1,
            productId: 1,
            title: 1,
            url: 1,
            bookNum: 1,
            category: 1,
            thai_category: 1,
            price: 1,
            amount: 1,
            img: 1,
        }).toArray()

        order.cart.map((element) => {
            for(let i=0; i<productDetails.length; i++){
                if(element.productId === productDetails[i].productId){
                    productDetails[i].amount = element.amount
                    productDetails[i].price = element.price
                }
            }
        })
        res.status(200).send({order, productDetails})
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}

exports.updateOrder = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { orderId, status } = req.body
        var update = {}
        if(status === 'delivered'){
            const { trackingNumber } = req.body
            update = {
                $set: {
                    status,
                    trackingNumber
                }
            }
        } else if(status === 'cancel'){
            const { cancelMessage } = req.body
            update = {
                $set: {
                    status,
                    cancel_message: cancelMessage,
                    failure_code: 'cancel_by_admin',
                    failure_message: cancelMessage,
                }
            }
        }
        await db.collection('orders').updateOne({ orderId: parseInt(orderId) }, update)
        
        res.status(200).send()
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        // await client.close()
    }
}