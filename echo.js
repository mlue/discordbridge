var Discord = require('discord.js');
var nlp = require('compromise');
var _l = require('lodash')
var Twitter = require('twitter')
var jsmegahal = require('jsmegahal');
var megahal = new jsmegahal(2);
var _util = require('util')
var client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
});
var fs = require('fs');

fs.readFile('./seed.txt','utf8', (err,data) => {
  megahal.addMass(data)
})
var bot = new Discord.Client({autoReconnect: true});

var tomato = ['jejune','pretentious', 'meh', "wouldn't see it in theatres", "first-rate", "insightful", "clever", "charming", "comical", "charismatic", "enjoyable", "uproarious", "original", "tender", "hilarious", "absorbing", "sensitive", "riveting", "intriguing"]

//var reactions = ['sounds interesting','that one sucks', "i'd watch it", "maybe not", "for real?", "lol no", "come on man"]

var reactions = ["🤷","👍", "👎"]

var emojis = null;

bot.on('ready', function() {
  console.log('logged in')

});

function askForScript() {
  bot.channels.find( c => c.id == '345940851412828161').send('gimme a script').catch()
}

(function loop() {
  var rand = Math.round(Math.random() * (1920000) + 240000) ;
  console.log(`doing it again in ${rand/(60000)} minutes`)
  setTimeout(function() {
    askForScript();
    loop();
  }, rand);
}());

function startStream(s){
  client.stream('statuses/filter', s,  function(stream) {
    stream.on('data', function(tweet) {
      if(tweet.level == 'medium' || tweet.retweeted || Math.random() < 0.001){
        var embed = new Discord.RichEmbed()
            .setColor("#"+tweet.user.profile_background_color)
            .setTimestamp(new Date(tweet.created_at))
            .setThumbnail(tweet.user.profile_image_url)
            .setAuthor(tweet.user.name)
            .setTitle(tweet.text)
            .addField("retweets", tweet.retweet_count, true)
            .setFooter(tweet.user.screen_name)
           .setURL(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
        if(tweet.user.location)embed.addField("location", tweet.user.location, true)
        bot.channels.find( c => c.id == '345940851412828161').send({embed}).catch(e => console.log(e));
      }
    })
    stream.on('error', e => console.log(e))
  })
}

function queryTwitter(s){
  client.get('search/tweets', {q: s},  function(error, tweets, response) {
    //console.log(_util.inspect(tweets))
    if(error)console.log(error)
    else{
      var tweet = _l(tweets.statuses).maxBy( t => t.retweet_count)
          var embed = new Discord.RichEmbed()
              .setColor("#"+tweet.user.profile_background_color)
              .setTimestamp(new Date(tweet.created_at))
              .setThumbnail(tweet.user.profile_image_url)
              .setAuthor(tweet.user.name)
              .setTitle(tweet.text)
              .addField("retweets", tweet.retweet_count, true)
              .setFooter(tweet.user.screen_name)
             .setURL(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
          if(tweet.user.location)embed.addField("location", tweet.user.location, true)
          bot.channels.find( c => c.id == '345940851412828161').send({embed}).catch(e => console.log(e));
        }
      })
}

bot.on('messageReactionAdd', (messageReaction, user) => {
  if( messageReaction.message.channel.id == '345940851412828161' && user.username == 'mlue' && messageReaction.emoji.name == "👍" ){
    client.post('statuses/update', {status: messageReaction.message.cleanContent},  function(error, tweet, response) {
      if(error)console.log(error);
      if(response)console.log(response);  // Raw response object.
    });
  }
});


bot.on('message', function(message) {
  if(message.cleanContent.match(/.{5,}\..+/))megahal.addMass(message.cleanContent)
  else megahal.add(message.cleanContent)
  var delay = Math.random()* 50000
  if(message.author.id != bot.user.id && message.channel.id == '345940851412828161' && message.author.username == 'gbp'){
    var convDelay = Math.random() * 120000+60000
    setTimeout(() => {
      console.log('sending in '+convDelay/60000+' minutes')
      message.channel.send(megahal.getReplyFromSentence(message.cleanContent))
    }, convDelay)
    if(message.cleanContent.length > 800){message.channel.startTyping()
    var topics = _l(nlp(message.cleanContent).nouns().out('array')).countBy().toPairs().sortBy(e => -e[1]).value();
    var pro = topics[0][0]
    var sup = topics[1] ? topics[1][0] : 'everyone else'
    if(message.cleanContent.length > 800)setTimeout(() => {
      // message.reply(reactions[Math.floor(Math.random() * reactions.length)]).catch((e) => console.log(e))
      message.react(reactions[Math.floor(Math.random() * reactions.length)]).catch((e) => console.log(e))
      var critiques = [`I'm not sure about ${pro}`, `${pro} was definitely unfair to ${sup}`, `Should ${pro} end up happy? What about ${sup}?`, `Should ${pro} end up happy? ${sup} was a shit`, `I don't understand ${pro}`, `${pro} didn't deserve that`, `This story makes no sense to me`, `Is this nonsense?`, `I guess the takeaway is that, in life people like ${pro} take advantage of people like ${sup}`, `What does what happened to ${pro} say about anything?`, `What could ${pro} represent in relation to ${sup}`]
        message.channel.send(critiques[Math.floor(Math.random() * critiques.length)]+'. '+tomato[Math.floor(Math.random() * tomato.length)]).catch((e) => console.log(e))
        message.channel.stopTyping();
      },10000)
    }
  }
  // if(resp && userID != bot.id){console.log('going to respond to resp in %s seconds',delay/1000), setTimeout(() => {
  // }, delay)}
})
bot.login(process.env.SECRET).then(() => {
  startStream({follow: '117394273,34418878,2420931980,2592325530,44918425', language: 'en', filter_level: 'low'});
  startStream({track: 'artificialintelligence, mvci, cryptocurrency, ethereum, openai, skynet, TWTonline', language: 'en', filter_level: 'low'});
  setTimeout(queryTwitter('overwatch'), 10000)
  setInterval(queryTwitter('overwatch'),1000*3600)
  askForScript();
  emojis = bot.guilds.first().emojis})
