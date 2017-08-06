(function () {
  'use strict';
  // this function is strict...
}());

/*jslint node: true */



Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _emojis = {};

var ekeys = require("emojis-keywords"),  evalues = require("emojis-list");

var redis = require('redis')

_client = redis.createClient();

const _emojis_old = require("emoji-name-map");

pry = require('pryjs')

const _q = require("q");

const _natural = require("natural");

const _distance = require("jaro-winkler")

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _irc = require('irc');

var _irc2 = _interopRequireDefault(_irc);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _discord = require('discord.js');

var _discord2 = _interopRequireDefault(_discord);

var _errors = require('./errors');

var _validators = require('./validators');

var _formatting = require('./formatting');

var _util = require('util');

var _sentiment = require('sentiment');

const positive_responses = ['+1', 'smiley']

const negative_responses = ['-1','angry']

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_winston2.default.setLevels({
  trace: 9,
  input: 8,
  verbose: 7,
  prompt: 6,
  debug: 5,
  info: 4,
  data: 3,
  help: 2,
  warn: 1,
  error: 0

});

_winston2.default.addColors({
  trace: 'magenta',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  debug: 'blue',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  error: 'red'

});

_winston2.default.remove(_winston2.default.transports.Console)
_winston2.default.add(_winston2.default.transports.Console, {
  level: 'trace',
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: true

});

var path = require("path");

var _countrylist = _lodash.map(require('country-list')().getNames(), (c) => { return _lodash.lowerCase(c)});

var base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
var defaultCategory = 'N';

var lexicon = new _natural.Lexicon(lexiconFilename, defaultCategory);
var rules = new _natural.RuleSet(rulesFilename);
var tagger = new _natural.BrillPOSTagger(lexicon, rules);


for (var i = 0; i < ekeys.length; i++) {
  //or check with: if (b.length > i) { assignment }
  _emojis[ekeys[i]] = evalues[i]
}


function responder(m,a,obj){
  m.react(a);
  _winston2.default.info(`******* responding with ${a}`);
  obj.throttle = 100;
}

function saveFact(msg, emoji, s, user){
  //I wanna encode the source with the fact to build a profile? and build a knowledge of knowldge
  var db_string = s == 'o' ? "emoji-fact-brain:" : "emoji-sentiment-brain:"
  if(/([^\s]+)\s(?:is|are|likes?)(?! not)(?: the)?(?: same)?(?: as)?(?: like)?\s*([^\s]+)/.exec(msg)){
    if(!_lodash.some(_lodash.map(tagger.tag([RegExp.$2, RegExp.$1]), function(g){return g[1]}), function(x){ return _lodash.includes(["PRP","DT"], x)})){
      var one = RegExp.$1 //s == "o" ? RegExp.$2 : RegExp.$1
      var two = RegExp.$2 //s == "o" ? RegExp.$1 : RegExp.$2
      // o is fact s is sentiment - l for like vs positive association
      db_string += s == 'o' ? one+":"+user+":p" : user+":"+one+(/likes/.exec(msg) ? ":l" : ":p");
      _client.hget(db_string, s == 'o' ? two : one, function(err, obj){
        _winston2.default.help("READ "+JSON.stringify(obj))
        var value = obj ? parseInt(obj) + 1 : 1
        _winston2.default.help("Writing "+db_string+"-"+two+"-"+value)
        _client.hset(db_string, two , value, redis.print)

      });
    }
  } else if(/([^\s]+)\s(?:(?:(?:is|are)(?: not))|(?:doesn't\slike)|(?:aren't|isn't))(?: the)?(?: same)?(?: as)?(?: like)?\s*([^\s]+)/.exec(msg)){
    //!_lodash.some(_lodash.map(tagger.tag([RegExp.$2, RegExp.$1]), function(g){return g[1]}), function(x){ return x == "PRP"})
    if(!_lodash(tagger.tag([RegExp.$2, RegExp.$1])).map(g => g[1]).some( x => x == "PRP")){
      var one = RegExp.$1 //s == "o" ? RegExp.$2 : RegExp.$1
      var two = RegExp.$2 //s == "o" ? RegExp.$1 : RegExp.$2
      db_string += s == 'o' ? one+":"+user+":n" : user+":"+one+(/likes/.exec(msg) ? ":d" : ":n");
      _client.hget(db_string, two, function(err, obj){
        _winston2.default.help("READ "+JSON.stringify(obj))
        var value = obj ? parseInt(obj) + 1 : 1
        _winston2.default.help("Writing "+db_string+" "+value)
        _client.hset(db_string, two, value, redis.print)

      });
    }
  }
}

const REQUIRED_FIELDS = ['server', 'nickname', 'channelMapping', 'discordToken'];
const NICK_COLORS = ['light_blue', 'dark_blue', 'light_red', 'dark_red', 'light_green', 'dark_green', 'magenta', 'light_magenta', 'orange', 'yellow', 'cyan', 'light_cyan'];
const patternMatch = /{\$(.+?)}/g;

/**
 * An IRC bot, works as a middleman for all communication
 * @param {object} options - server, nickname, channelMapping, outgoingToken, incomingURL
 */
class Bot {
  constructor(options) {
    REQUIRED_FIELDS.forEach(field => {
      if (!options[field]) {
        throw new _errors.ConfigurationError(`Missing configuration field ${field}`);
      }
    });

    (0, _validators.validateChannelMapping)(options.channelMapping);

    this.discord = new _discord2.default.Client({ autoReconnect: true });
    var wordnet = this.wordnet = new _natural.WordNet();
    this.isNumeric = function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);

    }

    this.findword = function(g,jj){
       var deferred = _q.defer();
      var msgs = []
      wordnet.lookup(g, function(results) {
        results.forEach(function(result) {
          msgs.push(...result.synonyms)
        });
        deferred.resolve(msgs);
      });
      return deferred.promise;}

    this.findwordfrombrain = function(g,jj){
      var deferred = _q.defer();
      var tally = 0
      var msg = ''
      var dbstring = "emoji-fact-brain:"+_natural.PorterStemmer.stem(g)+":*:p"
      var _this = this;
      _winston2.default.help(dbstring)
      _client.keys(dbstring,function(err, r){
        var all = _lodash.map(r, function(){return _q.defer()});
        r.forEach(function(key){
          _client.hgetall(key, function(err,obj){
            _winston2.default.help("READING FROM BRAIN"+_util.inspect(obj))
            var sortedkeys = _lodash.sortBy(Object.keys(obj), e => obj[e])
            var vall = _lodash.map(sortedkeys, e => _this.findword(e))
            _q.all(vall).done(function(syns){
              var syn = _lodash.flatten(syns)
              var found_emoji = _lodash.find(_lodash.keys(_this.emojis), e => _lodash.includes(syn,e))
//                var d = Object.keys(filtered).reduce(function(a, b){ return parseInt(obj[a]) > parseInt(obj[b]) ? a : b });
              all[r.indexOf(key)].resolve(found_emoji ? {word: found_emoji, weight: parseInt(obj[found_emoji])} : {word: '', weight: 0})
            })
          })})
        _q.all(_lodash.map(all, p => p.promise)).done(function(x){
          if(_lodash.isEmpty(x)){
            deferred.resolve('')
          }
          else{
            _winston2.default.help("READING FROM BRAIN"+_util.inspect(x))
            var g = _lodash.find(x, {weight: _lodash.max(_lodash.map(x, g => g.weight))}).word;
            deferred.resolve(g)
          }
        })
      })
      return deferred.promise;
    }

    this.server = options.server;
    this.last_msg_time = new Date().getTime()/1000;
    this.throttle = 100;
    this.nickname = options.nickname;
    this.ircOptions = options.ircOptions;
    this.discordToken = options.discordToken;
    this.commandCharacters = options.commandCharacters || [];
    this.ircNickColor = options.ircNickColor !== false; // default to true
    this.channels = _lodash2.default.values(options.channelMapping);
    this.ircStatusNotices = options.ircStatusNotices;
    this.announceSelfJoin = options.announceSelfJoin;
    this.emojis = _lodash.pickBy(_lodash.merge(_emojis, _emojis_old.emoji), (v, k) => {
      //!/(?:flag_(?!us|en)..:|:on:|:back:)/.exec(k) && !_lodash.includes(_countrylist, k)
      if(!/(?:flag_(?!us|en)..:|:on:|:back:|^one$|^two$|^three$|^four$)/.exec(k)) return true
      else{_winston2.default.info("OMITTING ",k); return false}
    })


    //['cake': '🍰', '🤷', '🍌','⌛', '💣', '🔋', '🎂', '🍂', '⚽','🤖']

    this.format = options.format || {};
    // "{$keyName}" => "variableValue"
    // nickname: discord nickname
    // displayUsername: nickname with wrapped colors
    // text: the (IRC-formatted) message content
    // discordChannel: Discord channel (e.g. #general)
    // ircChannel: IRC channel (e.g. #irc)
    // attachmentURL: the URL of the attachment (only applicable in formatURLAttachment)
    this.formatCommandPrelude = this.format.commandPrelude || 'Command sent from Discord by {$nickname}:';
    this.formatIRCText = this.format.ircText || '<{$displayUsername}> {$text}';
    this.formatURLAttachment = this.format.urlAttachment || '<{$displayUsername}> {$attachmentURL}';

    // "{$keyName}" => "variableValue"
    // author: IRC nickname
    // text: the (Discord-formatted) message content
    // withMentions: text with appropriate mentions reformatted
    // discordChannel: Discord channel (e.g. #general)
    // ircChannel: IRC channel (e.g. #irc)
    this.formatDiscord = this.format.discord || '**<{$author}>** {$withMentions}';

    // Keep track of { channel => [list, of, usernames] } for ircStatusNotices
    this.channelUsers = {};

    this.channelMapping = {};

    // Remove channel passwords from the mapping and lowercase IRC channel names
    _lodash2.default.forOwn(options.channelMapping, (ircChan, discordChan) => {
      this.channelMapping[discordChan] = ircChan.split(' ')[0].toLowerCase();
    });

    this.invertedMapping = _lodash2.default.invert(this.channelMapping);
    this.autoSendCommands = options.autoSendCommands || [];
  }

  connect() {
    _winston2.default.debug('Connecting to IRC and Discord');
    this.discord.login(this.discordToken);

    const ircOptions = _extends({
      userName: this.nickname,
      realName: this.nickname,
      channels: this.channels,
      floodProtection: true,
      floodProtectionDelay: 500,
      retryCount: 10
    }, this.ircOptions);

    this.ircClient = new _irc2.default.Client(this.server, this.nickname, ircOptions);
    this.attachListeners();
  }

  attachListeners() {
    this.discord.on('ready', () => {
      _winston2.default.info('Connected to Discord');
    });

    this.ircClient.on('registered', message => {
      _winston2.default.info('Connected to IRC');
      _winston2.default.debug('Registered event: ', message);
      this.autoSendCommands.forEach(element => {
        this.ircClient.send(...element);
      });
    });

    this.ircClient.on('error', error => {
      _winston2.default.error('Received error event from IRC', error);
    });

    this.discord.on('error', error => {
      _winston2.default.error('Received error event from Discord', error);
    });

    this.discord.on('warn', warning => {
      _winston2.default.warn('Received warn event from Discord', warning);
    });


    //anchor
    var l = (message, s, user = null) => {
      // Ignore bot messages and people leaving/joining
      if(s != 't')this.sendToIRC(message);
      var roll = Math.random() * 100;
      this.throttle -= (0.25 + ((new Date().getTime()/1000 - this.last_msg_time) * 1/72));
      this.last_msg_time = new Date().getTime()/1000;
      var msg = this.parseText(message);
      var should_msg = roll > ( /begin analysis/.exec(msg) ? 10 : this.throttle )
      _winston2.default.verbose('******************** rolled a '+roll+' vs '+( /begin analysis/.exec(msg) ? 10 : this.throttle ));
      msg = msg.replace(/^(?:@gbp:?\s*)?begin analysis/,' ')
      if(should_msg)_winston2.default.input("WRITING for "+msg+"\n\n\n\n");
      var presynmsgs = _lodash.reject(_lodash.split(msg.replace(/(dicks?|pussy|penis|assholes?|butts?)/,
                                                                'eggplant'),' '), function(g){return _lodash.includes(['it', 'a', 'i'],g)} || this.isNumeric(g) );

      _winston2.default.info('******************** MESSAGE SENTIMENT ',_sentiment(msg).score)
      if(_sentiment(msg).score >= 2){
        var positive_response = positive_responses[0]//Math.floor(Math.random() * positive_responses.length)]
        //responder(message, positive_response, this)
        _winston2.default.info('******************** positive '+positive_response)

        saveFact(msg, positive_response, 't', message.author.username)
      }
      else if(_sentiment(msg).score <= -2){
        var negative_response = negative_responses[0]//Math.floor(Math.random() * negative_responses.length)]
        //responder(message, negative_response, this)
        _winston2.default.info('******************** negative '+negative_response)
        saveFact(msg, negative_response,'t', message.author.username)
      }
      if(true){
        var _this = this
        var promises = _lodash.flatten(_lodash.map(presynmsgs, function(g){ return [_this.findword(g), _this.findwordfrombrain(g)]}))
        _q.all(promises).done(function(y){
          var msgs = _lodash.uniq(_lodash.flatten(y))
          _winston2.default.info("MESSAGE", msgs)
          var scrambledkeys = _lodash.sortBy(_lodash.keys(_this.emojis), function(){return Math.random()});
          //TODO MERGE brain associations back into associative array?
          var find = _lodash.find(scrambledkeys,
                                  function(g){ return _lodash.find(msgs, function(x){return _distance(_natural.PorterStemmer.stem(x),_natural.PorterStemmer.stem(_lodash.lowerCase(g))) >= 0.96})})
          _winston2.default.trace(`find found - ${find} - ${msg} `)
          var a = _this.emojis[find];
          if (a){
            _winston2.default.info('contextual from -- '+msg+' -- '+a);
            if(should_msg)responder(message, a, _this)
            saveFact(msg, find.replace(/\:/g,''), s, message.author.username)
          }
          else if(false){
            var len = _lodash.keys(_this.emojis).length;
            var keys = _lodash.keys(_this.emojis);
            var g = _this.emojis[keys[Math.floor(Math.random() * len)]]
            _winston2.default.info('************************* random ',g,' ', _lodash.findKey(_this.emojis, (item) => (item == g)));
            if(should_msg)responder(message, g, _this)
          }
        }
                             )}
    }

    this.discord.on('message', message => {
      _winston2.default.trace('timestamp')
      l(message, 'o')
    });

    this.discord.on('messageReactionAdd', (messageReaction, user) => {
      //builds indexes reaction to a simple proposition as a hash map for user sentiment profiles
      _winston2.default.debug('reaction:', messageReaction.emoji.name, user.username);
      l(messageReaction.message,'t', user.username)
    });

    this.ircClient.on('message', this.sendToDiscord.bind(this));

    this.ircClient.on('notice', (author, to, text) => {
      this.sendToDiscord(author, to, `*${text}*`);
    });

    this.ircClient.on('join', (channelName, nick) => {
      _winston2.default.debug('Received join:', channelName, nick);
      if (!this.ircStatusNotices) return;
      if (nick === this.nickname && !this.announceSelfJoin) return;
      const channel = channelName.toLowerCase();
      // self-join is announced before names (which includes own nick)
      // so don't add nick to channelUsers
      if (nick !== this.nickname) {
	if(!this.channelUsers[channel]){
	  this.channelUsers[channel] = new Set(Object.keys(nick))
	}
	this.channelUsers[channel].add(nick);
      }
      //this.sendExactToDiscord(channel, `*${nick}* has joined the channel`);
    });

    this.ircClient.on('part', (channelName, nick, reason) => {
      _winston2.default.debug('Received part:', channelName, nick, reason);
      if (!this.ircStatusNotices) return;
      const channel = channelName.toLowerCase();
      // remove list of users when no longer in channel (as it will become out of date)
      if (nick === this.nickname) {
        _winston2.default.debug('Deleting channelUsers as bot parted:', channel);
        delete this.channelUsers[channel];
        return;
      }
      if (this.channelUsers[channel]) {
        this.channelUsers[channel].delete(nick);
      } else {
        _winston2.default.warn(`No channelUsers found for ${channel} when ${nick} parted.`);
      }
      //this.sendExactToDiscord(channel, `*${nick}* has left the channel (${reason})`);
    });

    this.ircClient.on('quit', (nick, reason, channels) => {
      _winston2.default.debug('Received quit:', nick, channels);
      if (!this.ircStatusNotices || nick === this.nickname) return;
      channels.forEach(channelName => {
        const channel = channelName.toLowerCase();
        if (!this.channelUsers[channel]) {
          _winston2.default.warn(`No channelUsers found for ${channel} when ${nick} quit, ignoring.`);
          return;
        }
        if (!this.channelUsers[channel].delete(nick)) return;
        //this.sendExactToDiscord(channel, `*${nick}* has quit (${reason})`);
      });
    });

    this.ircClient.on('names', (channelName, nicks) => {
      _winston2.default.debug('Received names:', channelName, nicks);
      if (!this.ircStatusNotices) return;
      const channel = channelName.toLowerCase();
      this.channelUsers[channel] = new Set(Object.keys(nicks));
    });

    this.ircClient.on('action', (author, to, text) => {
      this.sendToDiscord(author, to, `_${text}_`);
    });

    this.ircClient.on('invite', (channel, from) => {
      _winston2.default.debug('Received invite:', channel, from);
      if (!this.invertedMapping[channel]) {
        _winston2.default.debug('Channel not found in config, not joining:', channel);
      } else {
        this.ircClient.join(channel);
        _winston2.default.debug('Joining channel:', channel);
      }
    });

    if (_winston2.default.level === 'debug') {
      this.discord.on('debug', message => {
        _winston2.default.debug('Received debug event from Discord', message);
      });
    }
  }

  static getDiscordNicknameOnServer(user, guild) {
    const userDetails = guild.members.get(user.id);
    if (userDetails) {
      return userDetails.nickname || user.username;
    }
    return user.username;
  }

  parseText(message) {
    const text = message.mentions.users.reduce((content, mention) => {
      const displayName = Bot.getDiscordNicknameOnServer(mention, message.guild);
      return content.replace(`<@${mention.id}>`, `@${displayName}`).replace(`<@!${mention.id}>`, `@${displayName}`).replace(`<@&${mention.id}>`, `@${displayName}`);
    }, message.content);

    return text.replace(/\n|\r\n|\r/g, ' ').replace(/<#(\d+)>/g, (match, channelId) => {
      const channel = this.discord.channels.get(channelId);
      if (channel) return `#${channel.name}`;
      return '#deleted-channel';
    }).replace(/<@&(\d+)>/g, (match, roleId) => {
      const role = message.guild.roles.get(roleId);
      if (role) return `@${role.name}`;
      return '@deleted-role';
    }).replace(/<(:\w+:)\d+>/g, (match, emoteName) => emoteName);
  }

  isCommandMessage(message) {
    return this.commandCharacters.indexOf(message[0]) !== -1;
  }

  static substitutePattern(message, patternMapping) {
    return message.replace(patternMatch, (match, varName) => patternMapping[varName] || match);
  }

  sendToIRC(message) {
    const author = message.author;
    // Ignore messages sent by the bot itself:
    if (author.id === this.discord.user.id) return;

    const channelName = `#${message.channel.name}`;
    const ircChannel = this.channelMapping[message.channel.id] || this.channelMapping[channelName];

    _winston2.default.debug('Channel Mapping', channelName, this.channelMapping[channelName]);
    if (ircChannel) {
      const fromGuild = message.guild;
      const nickname = Bot.getDiscordNicknameOnServer(author, fromGuild);
      let text = this.parseText(message);
      let displayUsername = nickname;
      if (this.ircNickColor) {
        const colorIndex = (nickname.charCodeAt(0) + nickname.length) % NICK_COLORS.length;
        displayUsername = _irc2.default.colors.wrap(NICK_COLORS[colorIndex], nickname);
      }

      const patternMap = {
        nickname,
        displayUsername,
        text,
        discordChannel: channelName,
        ircChannel
      };

      if (this.isCommandMessage(text)) {
        const prelude = Bot.substitutePattern(this.formatCommandPrelude, patternMap);
        this.ircClient.say(ircChannel, prelude);
        this.ircClient.say(ircChannel, text);
      } else {
        if (text !== '') {
            // Convert formatting
	    var untext = text.replace(/@gbp/,'gbp:')
          text = (0, _formatting.formatFromDiscordToIRC)(text);
          patternMap.text = text;

          text = Bot.substitutePattern(this.formatIRCText, patternMap);
          _winston2.default.debug('Sending message to IRC', ircChannel, text);
          this.ircClient.say(ircChannel, untext);
        }

        if (message.attachments && message.attachments.size) {
          message.attachments.forEach(a => {
            patternMap.attachmentURL = a.url;
            const urlMessage = Bot.substitutePattern(this.formatURLAttachment, patternMap);

            _winston2.default.debug('Sending attachment URL to IRC', ircChannel, urlMessage);
            this.ircClient.say(ircChannel, urlMessage);
          });
        }
      }
    }
  }

  findDiscordChannel(ircChannel) {
    const discordChannelName = this.invertedMapping[ircChannel.toLowerCase()];
    if (discordChannelName) {
      // #channel -> channel before retrieving and select only text channels:
      const discordChannel = discordChannelName.startsWith('#') ? this.discord.channels.filter(c => c.type === 'text').find('name', discordChannelName.slice(1)) : this.discord.channels.get(discordChannelName);

      if (!discordChannel) {
        _winston2.default.info('Tried to send a message to a channel the bot isn\'t in: ', discordChannelName);
        return null;
      }
      return discordChannel;
    }
    return null;
  }

  sendToDiscord(author, channel, text) {
    const discordChannel = this.findDiscordChannel(channel);
    if (!discordChannel) return;

    // Convert text formatting (bold, italics, underscore)
    const withFormat = (0, _formatting.formatFromIRCToDiscord)(text);

    const withMentions = withFormat.replace(/@[^\s]+\b/g, match => {
      const search = match.substring(1);
      const guild = discordChannel.guild;
      const nickUser = guild.members.find('nickname', search);
      if (nickUser) {
        return nickUser;
      }

      const user = this.discord.users.find('username', search);
      if (user) {
        return user;
      }

      const role = guild.roles.find('name', search);
      if (role && role.mentionable) {
        return role;
      }

      return match;
    });

    const patternMap = {
      author,
      text: withFormat,
      withMentions,
      discordChannel: `#${discordChannel.name}`,
      ircChannel: channel
    };

    // Add bold formatting:
    // Use custom formatting from config / default formatting with bold author
    const withAuthor = Bot.substitutePattern(this.formatDiscord, patternMap);
      _winston2.default.debug('Sending message to Discord', withAuthor, channel, '->', `#${discordChannel.name}`);
      if (author.match(/gbp/)) {
	  discordChannel.sendMessage(withFormat.replace(/gbp1:?/,''));
      }
  }

  /* Sends a message to Discord exactly as it appears */
  sendExactToDiscord(channel, text) {
    const discordChannel = this.findDiscordChannel(channel);
    if (!discordChannel) return;

    _winston2.default.debug('Sending special message to Discord', text, channel, '->', `#${discordChannel.name}`);
    discordChannel.sendMessage(text);
  }
}

exports.default = Bot;
