var Discord = require('discord.js');
var nlp = require('compromise');
var _l = require('lodash')
var Twitter = require('twitter')
var client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
});
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
  var rand = Math.round(Math.random() * (3600000) + 600000) ;
  console.log(`doing it again in ${rand/(60000)} minutes`)
  setTimeout(function() {
    askForScript();
    loop();
  }, rand);
}());

function startStream(s){
  client.stream('statuses/filter', s,  function(stream) {
    stream.on('data', function(tweet) {
      if(Math.random() > 0.5){
        var embed = new Discord.RichEmbed()
            .setColor("#"+tweet.user.profile_background_color)
            .setTimestamp(new Date(tweet.created_at))
            .setThumbnail(tweet.user.profile_image_url)
            .setAuthor(tweet.user.name)
            .setTitle(tweet.text)
            .addField("location", tweet.user.location, true)
            .addField("retweets", tweet.retweet_count, true)
            .addFooter(tweet.user.screen_name)
            .setURL(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
        bot.channels.find( c => c.id == '345940851412828161').send({embed}).catch(e => console.log(e));
      }
    })
  })
}


bot.on('message', function(message) {
  var delay = Math.random()* 30000
  if(message.author.id != bot.id && message.channel.id == '345940851412828161' && message.author.username == 'gbp' && message.content.match(/~fin~/)){
    message.channel.startTyping()
    var topics = _l(nlp(message.content).nouns().out('array')).countBy().toPairs().sortBy(e => -e[1]).value();
    var pro = topics[0][0]
    var sup = topics[1][0]
    setTimeout(() => {
      // message.reply(reactions[Math.floor(Math.random() * reactions.length)]).catch((e) => console.log(e))
      message.react(reactions[Math.floor(Math.random() * reactions.length)]).catch((e) => console.log(e))
      var critiques = [`I'm not sure about ${pro}`, `${pro} was definitely unfair to ${sup}`, `Should ${pro} end up happy? What about ${sup}?`, `Should ${pro} end up happy? ${sup} was a shit`, `I don't understand ${pro}`, `${pro} didn't deserve that`, `This story makes no sense to me`, `Is this nonsense?`, `I guess the takeaway is that, in life people like ${pro} take advantage of people like ${sup}`, `What does what happened to ${pro} say about anything?`, `What could ${pro} represent in relation to ${sup}`]
      if(message.content.length > 1500)message.reply(critiques[Math.floor(Math.random() * critiques.length)]+' '+tomato[Math.floor(Math.random() * tomato.length)]).catch((e) => console.log(e))
      message.channel.stopTyping();
    }), 5000
  }
  // if(resp && userID != bot.id){console.log('going to respond to resp in %s seconds',delay/1000), setTimeout(() => {
  // }, delay)}
})
bot.login(process.env.SECRET).then(() => {startStream({track: 'artificialintelligence, mvci, cryptocurrency, ethereum, openai, skynet', language: 'en', filter_level: 'medium'}); askForScript(); emojis = bot.guilds.first().emojis})
