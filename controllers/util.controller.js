const mongoUtil = require('../config/database')

const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const axios = require('axios')

exports.getExchangeRate = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)

        const symbol = req.params.symbol
        const cursor = await db.collection('globalData').findOne({field: 'exchange rate', data: { $elemMatch: {symbol} }},{
            projection: {
                _id: 0,
                data: 1
            }
        })
        // Update exchange rate every 3 hour
        // API limit 250 request per month
        if(cursor.data[0].expire < Date.now()){
            await axios.get("https://api.apilayer.com/exchangerates_data/convert?to=THB&from=USD&amount=1", { headers: {"apikey": process.env.FOREX_API_KEY}})
            .then(async result => {
                const data = Date.now()
                const newRate = result.data.result
                await db.collection('globalData').findOneAndUpdate( {field: 'exchange rate', data: { $elemMatch: {symbol} }}, {
                    $set : {
                        ["data.$"]: {
                            symbol,
                            rate: newRate,
                            lastUpdate: data,
                            expire: data + 3*60*60*1000,
                        }
                    }
                })
                res.send({rate: newRate, lastUpdate: data, expire: data + 3*60*60*1000})
            })
            .catch(error => {
                console.log( error)
                res.status(503).send({message: 'This Service not available'})
            })
        } else {
            res.send({rate: cursor.data[0].rate, lastUpdate: cursor.data[0].lastUpdate, expire: cursor.data[0].expire})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.getDigitalCurrencyRate = async (req ,res) => {
    try{
        const symbol = req.params.symbol
        const url = 'https://api.binance.com/api/v3/ticker/price?symbol=' + symbol
        console.log(url)
        await axios.get(url)
        .then(result => {
            console.log(result.data)
        }).catch(err => {
            console.log(err.message)
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    }
}