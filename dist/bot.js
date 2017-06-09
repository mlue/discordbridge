(function () {
  'use strict';
  // this function is strict...
}());

/*jslint node: true */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const _emojis = require("emoji-name-map");

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

    this.server = options.server;
    this.throttle = 0;
    this.nickname = options.nickname;
    this.ircOptions = options.ircOptions;
    this.discordToken = options.discordToken;
    this.commandCharacters = options.commandCharacters || [];
    this.ircNickColor = options.ircNickColor !== false; // default to true
    this.channels = _lodash2.default.values(options.channelMapping);
    this.ircStatusNotices = options.ircStatusNotices;
    this.announceSelfJoin = options.announceSelfJoin;
    this.emojis = _emojis.emoji//['cake': '🍰', '🤷', '🍌','⌛', '💣', '🔋', '🎂', '🍂', '⚽','🤖']

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

    this.discord.on('message', message => {
      // Ignore bot messages and people leaving/joining
      this.sendToIRC(message);
      var roll = Math.random() * 100;
      _winston2.default.info('rolled a '+roll);
      this.throttle += 1;
      if ( roll > this.throttle){
        var msg = this.parseText(message);
        var msgs = _lodash.reject(_lodash.split(msg.replace(/(dicks?|pussy|penis|assholes?|butts?)/,
                                             'eggplant').replace(/(shits?|asse?s?|crap)/,
                                                                 'poop'),' '), function(g){return _lodash.includes(['it'],g)});
        var scrambledkeys = _lodash.sortBy(_lodash.keys(this.emojis), function(){return Math.random()});
        var find = _lodash.find(scrambledkeys,
                                function(g){ return _lodash.find(msgs, function(x){return _distance(x,g) > 0.92})})
        _winston2.default.info(`find found - ${find} - ${msg} `)
        var a = this.emojis[find];
        if (a){
          _winston2.default.info('contextual from '+msg+' '+a);
          if(message.react(a))
            this.throttle = 20;
        }
        else if((Math.random() * 100) > 75) {
          var len = _lodash.keys(this.emojis).length;
          var keys = _lodash.keys(this.emojis);
          var g = this.emojis[keys[Math.floor(Math.random() * len)]]
          _winston2.default.info('random '+g);
          if(message.react(g))
            this.throttle = 20;
        }
      }
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
      this.sendExactToDiscord(channel, `*${nick}* has left the channel (${reason})`);
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
