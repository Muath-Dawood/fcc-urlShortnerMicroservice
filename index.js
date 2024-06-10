require('dotenv').config();
const express = require('express');
const cors = require('cors');
const URL = require('node:url')
const mongoose = require('mongoose');
const { parse } = require('node:path');
const AutoIncrement = require('mongoose-sequence')(mongoose)

const app = express();

// Database Configuration
mongoose.connect(process.env.MONGO_URI)
        .then(() => {
          console.log("Connected to database ...")
        })
        .catch((err) => {
          console.log(err.message)
        })

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    unique: true
  }
})
urlSchema.plugin(AutoIncrement, { id: 'short_url_seq', inc_field: 'short_url' })

const UrlModel = mongoose.model('URL', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded())
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Url helper function
function isValidHttpUrl(string) {
  try {
    const newUrl = new URL.URL(string);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  if(isValidHttpUrl(req.body.url)) {
    const newUrl = new UrlModel({ original_url: req.body.url })
    const savedUrl = await newUrl.save()
    res.json({ original_url: savedUrl.original_url, short_url: savedUrl.short_url })
  }else {
    res.json({ error: 'invalid url' })
  }
})

app.get('/api/shorturl/:url', async (req, res) => {
  const url = await UrlModel.find({short_url: parseInt(req.params.url)})
  if(url) {
    res.redirect(url.original_url)
  }else {
    res.json({ error: 'No short URL found for the given input' })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
