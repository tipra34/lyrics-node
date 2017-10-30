const cheerio = require('cheerio')
const axios = require('axios')
const express = require('express')
const app = express()

let topItunes = []

axios.get('http://lyrics.wikia.com/wiki/LyricWiki')
     .then((response)=>{
       let $;
       $ = cheerio.load(response.data);
       $('#mpITunesFeed>ol>li>b>a').each((i,elem)=>{
         let result = {
           link: $(elem).attr('href'),
           song: $(elem).text()
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
    axios.get(`http://lyrics.wikia.com/${elem.link}`)
    .then((response)=>{
      let data = response.data
      $ = cheerio.load(data)
      let lyrics = $('#mw-content-text>div.lyricbox').html()
      topItunes[index].lyrics = lyrics
      topItunes[index].link = $('iframe').attr('src')
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
    res.send({
      rescode: 200,
      link: $('iframe').attr('src'),
      lyrics: $('#mw-content-text>div.lyricbox').html()
    })
  }).catch((response)=>{
    rescode: 404
  })
})
app.listen(process.env.PORT, ()=>{
  console.log('listening on port 3000')
})
