const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const app = express();
//? jwt require;
const jwt = require('jsonwebtoken');
//!Firebase admin;
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;
//!firebase relative;
const serviceAccount = require("./smart-deails-firebase-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// TODO Midleware code here;
app.use(cors());
app.use(express.json());
// Todo: verifyFirebaseToken;
const verifyFireBaseToken = async (req, res, next) => {
    // console.log('Headder:-',req.headers);
    const authorzed = req.headers.authorization;
    if (!authorzed) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authorzed.split(' ')[1]
    // console.log(token);
    //?verify;
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.token_email = decoded.email
        next();
    }
    catch {
        return res.status(401).send({ messag: 'unauthorized access' })
    }
}
//!jwtTokenVerify;
const verifyJWTToken = (req, res, next) => {
    const authorized = req.headers.authorization;
    if (!authorized) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authorized.split(' ')[1]
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    //?verify jwt
    jwt.verify(token, process.env.JWT_SCRETE, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        // console.log('afer decoded',decoded);
        req.token_email = decoded.email;
        next()

    })
}
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
        //! jwt relative apis;
        app.post('/getToken', (req, res) => {
            const loggedEmail = req.body;
            const token = jwt.sign(loggedEmail, process.env.JWT_SCRETE, { expiresIn: '1h' })
            res.send({ token: token });
        })
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
        app.post('/products', verifyFireBaseToken, async (req, res) => {
            //? receive authorization;
            // console.log('Authorization:-', req.headers.authorization);
            // console.log('tokem_email',req.token_email);
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
        app.get('/products/bids/:thisProductId', verifyJWTToken, async (req, res) => {

            const productId = req.params.thisProductId;
            const query = { product: productId }
            const cursor = bidsColl.find(query).sort({ bid_price: -1 })
            const result = await cursor.toArray();
            res.send(result)
        })
        //TODO: MyBids get db;
        app.get('/bids', verifyFireBaseToken, async (req, res) => {
            //!accessToken receive;
            const email = req.query.email;
            const query = {}
            if (email) {
                if (email !== req.token_email) {
                    return res.status(403).send({ message: 'foribiding access' })
                }
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

