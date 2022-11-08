const mongoUtil = require('../config/database')
const axios = require('axios')

exports.getExchangeRate = async (req, res) => {
    try {
        mongoUtil.connectToServer(async function(err, client){
            if (err) { 
                console.log(err)
                res.status(503).send({ message: 'Cannot connect to database', error: err})
            }
            const db = mongoUtil.getDb()
            const symbol = req.params.symbol
            const cursor = await db.collection('globalData').findOne({field: 'exchange rate', data: { $elemMatch: {symbol} }},{
                projection: {
                    _id: 0,
                    data: 1
                }
            })
            // Update exchange rate every 20 min
            // API limit 250 request for month
            if(cursor.data[0].expire < Date.now()){
                axios.get("https://api.apilayer.com/exchangerates_data/convert?to=THB&from=USD&amount=1", { headers: {"apikey": process.env.FOREX_API_KEY}})
                .then(result => {
                    const data = Date.now()
                    const newRate = result.data.result
                    db.collection('globalData').findOneAndUpdate({field: 'exchange rate', data: { $elemMatch: {symbol} }},{
                        $set : {
                            ["data.$"]: {
                                symbol,
                                rate: newRate,
                                lastUpdate: data,
                                expire: data + 20*60*1000,
                            }
                        }
                    })
                    res.send({rate: newRate, lastUpdate: Date.now()})
                })
                .catch(error => {
                    console.log( error)
                    res.status(503).send({message: 'Server not available'})
                })
            } else {
                res.send({rate: cursor.data[0].rate, lastUpdate: cursor.data[0].lastUpdate})
            }
        })    
    } catch (error) {
        res.status(503).send({message: 'Server not available'})
    }
    
}