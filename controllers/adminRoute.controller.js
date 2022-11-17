
const mongoUtil = require('../config/database')
mongoUtil.connectToServer(function(err, client){
    if (err) console.log(err);
})
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
  
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
        }else{
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
        }
        const newProduct = await db.collection('products').insertOne(newData)
        const target = "products.total" + category.charAt(0).toUpperCase() + category.slice(1)
        const addIdTarget = "products." + category + "Id"
        const updateSeries = await db.collection('series').updateOne({seriesId: parseInt(seriesId)}, {
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
        })
        res.status(201).send({
            message: "Add product success",
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
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
                otherId: []
            }
        })
        res.status(201).send({
            message: "Add series success",
        })
        await calculateCos(db)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }

}

exports.reCalculateCos = async (req, res) => {
    try {
        var db = mongoUtil.getDb()
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
    } catch (error) {
        
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
        await client.close()
    }
}
