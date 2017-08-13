var Discord = require('discord.js');

var bot = new Discord.Client({autoReconnect: true});

bot.on('ready', function() {
  console.log('logged in')

});

function askForScript() {
  bot.channels.find( c => c.id == '345940851412828161').send('gimme a script').catch()
}

(function loop() {
  var rand = Math.round(Math.random() * (5000000)) + 500000;
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
      message.react(Math.round(Math.random() * 10) ? ':+1:': ':-1:')
      message.channel.stopTyping();
    }), 5000
  }
  // if(resp && userID != bot.id){console.log('going to respond to resp in %s seconds',delay/1000), setTimeout(() => {
  // }, delay)}
})
bot.login("MzQ1NTgyNzQ2OTQ2NzY0ODAw.DG9Yiw.5cYlQnqJGmvjoT8hyeLRz7gT1bY").then(askForScript)
