var Discord = require('discord.io');

var bot = new Discord.Client({
  token: "MzQ1NTgyNzQ2OTQ2NzY0ODAw.DG9Yiw.5cYlQnqJGmvjoT8hyeLRz7gT1bY",
  autorun: true
});

var godot = require('./godot')
var g = new godot.Godot()
bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);

});

bot.on('message', function(user, userID, channelID, message, event) {
  console.log('%s %s %s', channelID, message, userID)
  var resp =  g.play(message)
  var delay = Math.random()* 5000
  if(resp && userID != bot.id){console.log('going to respond to resp in %s seconds',delay/1000), setTimeout(() => {
    bot.sendMessage({
      to: '201453750303326209',
      message: resp
    });
  }, delay)}
})
