const Helper = require('./config');

function routes(app, accounts, marketPlace, Token) {

    // to get all listed items in marketplace
    
    app.get('/all-items', async (req, res) => {
        try {
            const Items = await marketPlace.methods.count().call();
            res.json({ "status": "success", "data": Items })
        }
        catch (err) {
            res.status(400).json({ "status": "Failed", "reason": err })
        }
    });

    
    /*
        to mint and sell NFT in marketplace 
        URI = "Not null"
        Price = grater than 0 
        NFT_addr = "NFT contract address"
    */

    app.post('/sell', async (req, res) => {
        const { URI, Price, NFT_addr } = req.body();
        if ((URI != "") && (Price > 0) && (NFT_addr == Helper.NFT_ADDRESS)) {
            try {
                await marketPlace.methods.sellItem(URI, Price, NFT_addr).send({ from: accounts[0] }).on('receipt', function (result) {
                    res.json({ "status": "success", "data": result })
                });
            }
            catch (err) {
                res.status(400).json({ "status": "Failed", "reason": err })
            }
        }
        else {
            res.status(400).json({ "status": "Failed", "reason": "wrong input" })
        }
    });

    /* 
        to buy NFT in marketplace 
        temID = not 0
        Should Have enough TKC coin (ERC20)
        Item should be in active
        Not to be a item creator call!
    */

    app.post('/buy', async (req, res) => {
        const { itemID } = req.body();
        if (itemID > 0) {
            let isCreator = await marketPlace.methods.isCreator(itemID, accounts[0]).call()
            let isActive = await marketPlace.methods.isActive(itemID).call()
            let price = await marketPlace.methods.itemPrice(itemID).call()
            let amount = await Token.methods.balanceOf(accounts[0]).call()
            if (isCreator) {
                res.status(400).json({ "status": "Failed", "reason": "creator not allowed" })
            } else if (!isActive) {
                res.status(400).json({ "status": "Failed", "reason": "Item is not in Active" })
            } else if (amount < price) {
                res.status(400).json({ "status": "Failed", "reason": "insufficient balance" })
            } else {
                try {
                    await Token.methods.increaseAllowance(Helper.MARKET_ADDRESS, price).send(accounts[0]).on('receipt', function (Tx) {
                        console.log(Tx);
                    }).then(async function () {
                        await marketPlace.methods.buyItem(itemID).send({ from: accounts[0] }).on('receipt', function (result) {
                            res.json({ "status": "success", "data": result })
                        })
                    });
                }
                catch (err) {
                    res.status(400).json({ "status": "Failed", "reason": err })
                }
            }
        }
        else {
            res.status(400).json({ "status": "Failed", "reason": "wrong input" })
        }
    });

    /* 
        to cancel NFT Item listing in marketplace 
        temID = not 0
        Item should be in active
        it should be a item creator call!
    */

    app.post('/cancelItem', async (req, res) => {
        const { itemID } = req.body();
        if (itemID > 0) {
            let isCreator = await marketPlace.methods.isCreator(itemID, accounts[0]).call()
            let isActive = await marketPlace.methods.isActive(itemID).call()
            if (!isCreator) {
                res.status(400).json({ "status": "Failed", "reason": "creator not allowed" })
            } else if (!isActive) {
                res.status(400).json({ "status": "Failed", "reason": "Item is not in Active" })
            } else {
                try {
                    await marketPlace.methods.cancelItem(itemID).send({ from: accounts[0] }).on('receipt', function (result) {
                        res.json({ "status": "success", "data": result })
                    });
                }
                catch (err) {
                    res.status(400).json({ "status": "Failed", "reason": err })
                }
            }
        }
        else {
            res.status(400).json({ "status": "Failed", "reason": "wrong input" })
        }
    });

}
module.exports = routes