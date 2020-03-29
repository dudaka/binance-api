const crypto = require('crypto')
const axios = require('axios')
const qs = require('querystring')

const renameKeys =  require('../renameKeys')
const {binanceRestSchema} = require("./schema")

/**
* https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md
*	Example: api.rest.time().then(data => console.log(data))
*	Example: api.rest.depth({symbol: 'ETHBTC', limit: 100}).then(data => console.log(data))
 */

const url = 'https://api.binance.com/api/'

const schema = {
    test: {
        url: 'v3/ping',
    },
    exchangeInfo: {
        url: 'v3/exchangeInfo',
    },
    time: {
        url: 'v3/time',
    },
    depth: {
        url: 'v3/depth',
    },
    klines: {
        url: 'v3/klines',
    },
    trades: {
        url: 'v3/trades',
    },
    avgPrice: {
        url: 'v3/avgPrice'
    },
    aggTrades: {
        url: 'v3/aggTrades'
    },
    ticker24hr: {
        url: 'v3/ticker/24hr',
    },
    ticker: {
        url: 'v3/ticker/price',
    },
    account: {
        url: 'v3/account',
        method: 'get',
        private: true
    },
    openOrders: {
        url: 'v3/openOrders',
        method: 'get',
        private: true
    },
    allOrders: {
        url: 'v3/allOrders',
        method: 'get',
        private: true
    },
    createOrder: {
        url: 'v3/order',
        method: 'post',
        private: true,
        params: {
            timeInForce: 'GTC',
        }
    },
    deleteOrder: {
        url: 'v3/order',
        method: 'delete',
        private: true
    },
    myTrades: {
        url: 'v3/myTrades',
        method: 'get',
        private: true
    },
    createTestOrder: {
        url: 'v3/order/test',
        method: 'post',
        private: true,
        params: {
            timeInForce: 'GTC',
            type: 'LIMIT'
        }
    },
}

const rename = (data, event) => renameKeys(binanceRestSchema[event], data)

const headers = {}

const requestPrivateAPI = ({params: _params = {}, ...data}, {auth = {}, params = {}}, event) => {
    const timestamp = Date.now()

    const queryString = qs.stringify(Object.assign(params, _params, {timestamp}))

    const signature = crypto.createHmac('sha256', auth.secret)
        .update(queryString)
        .digest('hex')

    const options = {
        method: data.method,
        url: url + data.url,
        headers: Object.assign({'X-MBX-APIKEY': auth.key}, headers),
        params: Object.assign(params, data.params, {signature}, {timestamp})
    }

    return axios(options).then(data => rename(data.data, event))
}

const requestPublicAPI = (data, payload = {}, event) => {
    return axios.get(url + data.url, {params: payload, headers}).then(data => rename(data.data, event))
}

const api = Object.keys(schema).reduce((result, item) => {
    result[item] = payload => (schema[item].private) ? requestPrivateAPI(schema[item], {...payload}, item) : requestPublicAPI(schema[item], payload, item)
    return result
}, {})

module.exports = {
    ...api
}
