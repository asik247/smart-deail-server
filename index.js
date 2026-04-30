const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const app = express();
//!Firebase admin;
const port = process.env.PORT || 3000;
//!firebase relative;
// TODO Midleware code here;
app.use(cors());
app.use(express.json());
// Todo: verifyFirebaseToken;
// ! uri code here;
const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.BD_PASS}@cluster0.fdzc9ua.mongodb.net/?appName=Cluster0`;
// ! db client code here;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
// ! Root Api code here;
app.get('/', (req, res) => {
    res.send('This is Smart Detail server aaaa')
})
// ! run funk code here;
async function run() {
    try {
        //? connect db;
        await client.connect()
        //! create mydb and productsColl;
        const mydb = client.db('smartDeails');
        const productsColl = mydb.collection('products')
        //! Bids Coll;
        const bidsColl = mydb.collection('bids')
        //! User Coll;
        const userColl = mydb.collection('users')
        //TODO:Get method all data using find;
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            // const cate = req.query.category
            // console.log(cate);
            // console.log(email);
            console.log(req.headers.authorization);
            const query = {};
            if (email) {
                query.email = email;
            }
            const cursor = productsColl.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        //TODO:Get method but specifiq id use and fetch data usign findOne;
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsColl.findOne(query)
            res.send(result)
        })
        //TODO: Post method usign insertOne;
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productsColl.insertOne(newProduct);
            res.send(result);
        })
        //TODO:Update method using patch;
        app.patch('/products/:id', async (req, res) => {
            const allProducts = req.body;
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    name: allProducts.name,
                    price: allProducts.price
                }
            }
            const result = await productsColl.updateOne(query, update);
            res.send(result)
        })
        //TODO: Delete method using delete;
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsColl.deleteOne(query);
            res.send(result)
        })
        //TODO: Bids Post method;
        app.post('/bids', async (req, res) => {
            const newBids = req.body;
            // console.log(newBids);
            const result = await bidsColl.insertOne(newBids);
            res.send(result)
        })
        //TODO Delete Bids using id mehod delete;
        app.delete('/bids/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            console.log(query);
            // console.log(id);
            // res.send()
            const result = await bidsColl.deleteOne(query);
            res.send(result)
        })

        //TODO: Specifiqe Product bid collected cod here;
        app.get('/products/bids/:thisProductId', async (req, res) => {
            const productId = req.params.thisProductId;
            const query = { product: productId }
            const cursor = bidsColl.find(query).sort({ bid_price: -1 })
            const result = await cursor.toArray();
            res.send(result)
        })
        //TODO: MyBids get db;
        app.get('/bids', async (req, res) => {
            //!accessToken receive;
            const email = req.query.email;
            const query = {}
            if (email) {
                query.buyer_email = email
            }
            const cursor = bidsColl.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        //TODO UserColl data post method code here;
        app.post('/users', async (req, res) => {
            const newUsers = req.body;
            //! cheack email then data post code hre;
            const email = req.body.email;
            const query = { email: email };
            const existingUser = await userColl.findOne(query);
            if (existingUser) {
                res.send({ message: 'user already exits' })
            }
            else {
                const result = await userColl.insertOne(newUsers);
                res.send(result)
            }

        })
        //? Latest Products api here;
        app.get('/latestProducts', async (req, res) => {
            const cursor = productsColl.find().sort({ created_at: -1 }).limit(6)
            const result = await cursor.toArray()
            res.send(result)
        })










        // ? Ping message code;
        await client.db("admin").command({ ping: 1 })
        console.log("Pinged your deployment.u successfully connected to MongoDB!");
    }
    finally {

    }
}
run().catch(console.dir)
//?Listing code here;
app.listen(port, () => {
    console.log(`This server runing in port: ${port}`);
})

