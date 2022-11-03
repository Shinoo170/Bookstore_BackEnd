// [ connect to database ]
const mongoUtil = require('../config/database')
mongoUtil.connectToServer(function(err, client){
    if (err) console.log(err);
})

  
exports.addProduct = async (req, res) => {
    try {
        var db = mongoUtil.getDb()
        const { seriesId, title, bookNum, category, thai_category, description, status, price, amount, img } = req.body

        mongoUtil.getNextSequence('productId', async function(err, result){
            var url = title.trim().replaceAll(" ","-")
            if(category === 'novel' || category === 'manga'){
                url += '-เล่ม-' + bookNum + '-' + thai_category
            }else{
                url +=  '-' + bookNum + '-สินค้า'
            }
            const newData = {
                seriesId,
                productId: result,
                title: title.trim(),
                url,
                bookNum: parseInt(bookNum),
                category,
                thai_category,
                description,
                status,
                price: parseInt(price),
                amount: parseInt(amount),
                img,
                score: { avg:0 , count:0 },
                addDate: Date.now(),
                lastModify: Date.now(),
            }
            db.collection('products').insertOne(newData, function(err, result){
                if(err) res.status(400).send({ message: "cannot add product", error: err.message })
                const target = "products.total" + category.charAt(0).toUpperCase() + category.slice(1)
                const addIdTarget = "products." + category + "Id"
                db.collection('series').updateOne({seriesId: parseInt(seriesId)},{
                    $inc: {
                        "products.totalProducts": 1,
                        [target]: 1,
                    },
                    $push: {
                        [addIdTarget]: result.insertedId,
                    }
                })
                res.status(201).send({
                    message: "Add product success",
                })
            })
        })
    } catch (err) {
        res.status(400).send({ message: "error", error: err.message })
    }
}

exports.addSeries = async (req, res) => {
    try {
        var db = mongoUtil.getDb()
        const { title, author, illustrator, publisher, genres, keywords, img } = req.body
        const description = req.body.description === 'undefined'? undefined : req.body.description
        const date = Date.now();
        mongoUtil.getNextSequence( 'seriesId', async function(err, result){
            await db.collection('series').insertOne({
                seriesId: result,
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
            }, function(err, result){
                calculateCos()
            })
        })
        res.status(201).send({
            message: "Add series success",
        })
    } catch (err) {
        res.status(400).send({ 
            message: "Cannot add Series",
            error: err.message 
        })
    }
}

exports.reCalculateCos = (req, res) => {
    var db = mongoUtil.getDb()
    db.collection('series').find({}, {
        projection: {
            _id: 0,
            seriesId: 1,
            title: 1,
            keywords: 1,
        }
    }).toArray( async (err, result) => {
        const arr = [...result]
        const length = arr.length
        // get cosineSimilarity
        const new_cosine_sim = Array(length).fill().map(() => Array(length));
        var cosine_sim
        for(let i=0; i<arr.length; i++){
            for(let j=i+1; j<arr.length; j++){
                cosine_sim = cosineSimilarity(arr[i], arr[j])
                new_cosine_sim[i][j] = cosine_sim
                new_cosine_sim[j][i] = cosine_sim
            }
            new_cosine_sim[i][i] = 1
        }
        res.send(new_cosine_sim)
        db.collection('cosineTable').updateOne({name: 'origin'},{
            $set: {data: new_cosine_sim}
        })
    })
}

async function calculateCos(){
    var db = mongoUtil.getDb()
    db.collection('series').find({}, {
        projection: {
            _id: 0,
            seriesId: 1,
            title: 1,
            keywords: 1,
        }
    }).toArray( async (err, result) => {
        const arr = [...result]
        const newSeriesId = arr.length - 1
        if(newSeriesId == -1) { return }
        if(newSeriesId == 0){
            await db.collection('cosineTable').insertOne({
                name: 'origin',
                data: [[1]]
            })
            return
        }
        // get cosineSimilarity
        const data = await db.collection('cosineTable').findOne({name: 'origin'}, {projection: {_id:0, data:1} })
        const new_cosine_sim = data.data

        new_cosine_sim.push([])
        for(let i=0; i<arr.length-1; i++){
            const cosine_sim = cosineSimilarity(arr[i], arr[newSeriesId])
            new_cosine_sim[i].push(cosine_sim)
            new_cosine_sim[newSeriesId].push(cosine_sim)
        }
        new_cosine_sim[newSeriesId].push(1)
        db.collection('cosineTable').updateOne({name: 'origin'},{
            $set: {data: new_cosine_sim}
        })
    })
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

exports.addGenres = async (req, res) => {
    var db = mongoUtil.getDb()
    const newGenres = req.body.newGenres
    await db.collection('globalData').updateOne({ field: 'genres'},{
        $push: {
            data: newGenres
        }
    })
    res.send('add success')
}