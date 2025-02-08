import express from "express"
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import dotenv from "dotenv"
dotenv.config()

const app = express()
const PORT = 3000

app.set("view engine", "ejs")
app.use(express.json());
app.use(express.urlencoded({ extended: true }))



const MONGO_URI = process.env.MONGO_URI;


mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model('Url', urlSchema);


app.get('/links', async (req, res) => {
    const links = await Url.find().sort({ createdAt: -1 });
    res.json(links);
});


// Endpoint to shorten a URL
app.post('/shorten', async (req, res) => {
    const { url: originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ error: 'URL is required' });

    const shortId = nanoid(6);

    // Save to MongoDB
    const newUrl = new Url({ originalUrl, shortId });
    await newUrl.save();

    res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${shortId}` });

});



// Endpoint to redirect to original URL
app.get('/:shortId', async (req, res) => {
    const { shortId } = req.params;
    const urlEntry = await Url.findOne({ shortId });

    if (!urlEntry) return res.status(404).json({ error: 'Short URL not found' });

    res.redirect(urlEntry.originalUrl);
});

app.get("/", (req, res) => {
    res.render("index")
})

app.listen(PORT, () => {
    console.log("Server deployed on port 3000");
})