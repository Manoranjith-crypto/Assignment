const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes');
const Web3 = require('web3');
const Helper = require('./config');
//const mongodb = require('mongodb').MongoClient;

app.use(cors());
app.use(express.json());

if (typeof web3 !== 'undefined') {
        var web3 = new Web3(web3.currentProvider);
    } else {
        var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
        //local http wallet
}

const engine = async() => {
    const accounts = await web3.eth.getAccounts();
    const marketPlace = new web3.eth.Contract(Helper.MARKET_ABI, Helper.MARKET_ADDRESS);
    const Token = new web3.eth.Contract(Helper.TOKEN_ABI, Helper.TOKEN_ADDRESS);

    routes(app, accounts, marketPlace, Token); 
}
engine();

// mongodb.connect('----------',
//         {
//                 useUnifiedTopology: true,
//         }, async (err, client) => {
//         const db =client.db('Cluster0');
// });
app.listen(process.env.PORT || 3001, () => {
    console.log('listening on port '+ (process.env.PORT || 3001));
});