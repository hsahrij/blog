import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb'
import path from 'path';


const WithDb = async (opereations) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('personal-blog');

        await opereations(db)

        client.close();
    } catch (error) {
        res.status(500).send({
            message: "error connecting",
            error
        })
    }

};

const app = express();
console.log(__dirname);
app.use(express.static(path.join(__dirname,"/build/")));
app.use(bodyParser.json())

app.get('/api/articles/:name', async (req, res) => {

    WithDb(async (db) => {
        const articleName = req.params.name;
        const article = await db.collection('articles').findOne({
            name: articleName
        });
        res.status(200).send(article);
    });



})
app.get('/hello', (req, res) => res.send('hello'));
app.get('/hello/:name', (req, res) => res.send(`hello ${req.params.name}`));
app.post('/hello', (req, res) => res.send(`hello ${req.body.name} from post`))

app.post('/api/articles/:name/upvote', async (req, res) => {

    WithDb(async (db) => {
        const articleName = req.params.name;
        const article = await db.collection('articles').findOne({ name: articleName })
        const upvotesCount = article.upvotes + 1;
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': { upvotes: upvotesCount }
        });
        const articleafter = await db.collection('articles').findOne({ name: articleName })
        res.status(200).send(articleafter);
    });

});

app.post('/api/articles/:name/add-comment', async (req, res) => {
    WithDb(async (db) => {
        const articleName = req.params.name;
        const { username, text } = req.body;
        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const articleafter = await db.collection('articles').findOne({ name: articleName })
        res.status(200).send(articleafter);

    })

});

app.get('*',
    (req,res)=>{
        res.sendFile(path.join(__dirname,'/build/index.html'));
    }
)

app.listen(8000, () => console.log('app is listing on 8000'));