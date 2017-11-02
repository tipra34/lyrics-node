const cheerio = require('cheerio')
const axios = require('axios')
const express = require('express')
const app = express()

let topItunes = []

var allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.use(allowCrossDomain)

axios.get('http://lyrics.wikia.com/wiki/LyricWiki')
     .then((response)=>{
       let $;
       $ = cheerio.load(response.data);
       $('#mpITunesFeed>ol>li>b>a').each((i,elem)=>{
         let result = {
           link: $(elem).attr('href')
         }
         topItunes.push(result)
       })
       getTopItunesLyrics()
     })
     .catch((err)=>{
     })

function getTopItunesLyrics(){
  topItunes.forEach((elem,index)=>{
    let $;
    axios.get(`http://lyrics.wikia.com${elem.link}`)
    .then((response)=>{
      let data = response.data
      $ = cheerio.load(data)
      let lyrics = $('#mw-content-text>div.lyricbox').html()
      let artistsong = elem.link.match(/([^/:]*):(.*)/)
      let embed = $('span.youtube').text()
      topItunes[index].lyrics = lyrics
      topItunes[index].artist = artistsong[1]
      topItunes[index].song = artistsong[2]
      if(embed){
        embed = 'https://www.youtube.com/watch?v=' + embed.match(/[^|]*/)[0]
        topItunes[index].embed = embed
      }
      }).catch((response)=>{
      topItunes[index].lyrics = 'No lyrics found'
    })
  })
}

app.get('/itunes/',(req, res)=>{
  res.send({
    rescode:200,
    topItunes
  })
});

app.get('/search/:query',(req, res)=>{
  let $;
  axios.get(`http://lyrics.wikia.com/wiki/Special:Search?search=${req.params.query}`)
  .then((response)=>{
    let data = response.data
    $ = cheerio.load(data)
    let results = [];
    $('.result>article>h1').each((i,elem)=>{
      let result = $(elem).text().match(/([^:^\t^\n]*):(.*)/)
      if(result){
        results.push({
        artist: result[1],
        song: result[2],
        })
      }
    })
    res.send({
      rescode:200,
      results
    })
  }).catch((err)=>{
    res.send({rescode:404,err});
  })
})

app.get('/lyrics/:artistsong', function(req, res){
  let $;
  axios.get(`http://lyrics.wikia.com/wiki/${req.params.artistsong}`)
  .then((response)=>{
    let data = response.data
    $ = cheerio.load(data)
    let embed = $('span.youtube').text()
    let result ={}
    if(embed){
      result.embed = 'https://www.youtube.com/watch?v=' + embed.match(/[^|]*/)[0]
    }
    result.rescode = 200
    result.lyrics = $('#mw-content-text>div.lyricbox').html()
    res.send(result)
  }).catch((response)=>{
    rescode: 404
  })
})
app.listen(process.env.PORT, ()=>{
  console.log('listening on port 3000')
})
