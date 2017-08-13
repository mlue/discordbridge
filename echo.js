var Discord = require('discord.js');

var bot = new Discord.Client({autoReconnect: true});

//var reactions = ['sounds interesting','that one sucks', "i'd watch it", "maybe not", "for real?", "lol no", "come on man"]

var reactions =  ['+1', '-1']

var emojis = null;

bot.on('ready', function() {
  console.log('logged in')

});

function askForScript() {
  bot.channels.find( c => c.id == '345940851412828161').send('gimme a script').catch()
}

(function loop() {
  var rand = Math.round(Math.random() * (600000)) + 300000;
  console.log(`doing it again in ${rand/1000}`)
  setTimeout(function() {
    askForScript();
    loop();
  }, rand);
}());


bot.on('message', function(message) {
  var delay = Math.random()* 30000
  if(message.author.id != bot.id && message.channel.id == '345940851412828161' && message.author.username == 'gbp' && message.content.match(/how about this one:/)){
    message.channel.startTyping()
    setTimeout(() => {
      // message.reply(reactions[Math.floor(Math.random() * reactions.length)]).catch((e) => console.log(e))
      message.react(reactions[Math.floor(Math.random() * reactions.length)]).catch((e) => console.log(e))
      message.react(emojis.random())
      message.channel.stopTyping();
    }), 5000
  }
  // if(resp && userID != bot.id){console.log('going to respond to resp in %s seconds',delay/1000), setTimeout(() => {
  // }, delay)}
})
bot.login("MzQ1NTgyNzQ2OTQ2NzY0ODAw.DG9Yiw.5cYlQnqJGmvjoT8hyeLRz7gT1bY").then(() => {askForScript(); emojis = bot.guilds.first().emojis})
