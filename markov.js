'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Markov {
  constructor(options){
    var fs = require('fs'),
    sys = require('sys'),   
    redis = require('redis-client').createClient();
  }


  init() {
    var texts = fs.readdirSync(__dirname + '/texts');
      for(var i = 0; i < 1; i++) {
          var filename = __dirname + '/texts/' + texts[i];
          fs.readFile(filename, 'ascii', function(err, data) {
              var words = data.split(/\s+/);
              for(var j = 0; j < words.length - 1; j++) {
                  redis.hincrby(words[j], words[j+1], 1);
              }
          });
      }
  }

  learn(data) {
    var words = data.split(/\s+/);
    for(var j = 0; j < words.length - 1; j++) {
        redis.hincrby("markov:"+words[j], words[j+1], 1);
    }
  }

  randomWord(callback) {
      redis.randomkey(function(result, key) {
          callback(key);
      });
  }

  nextWord(word, callback) {
      redis.exists(word, function(err, data) {
          if (data == null) { callback(null); }
          else {
              redis.hgetall("markov:"+word, function(result, data) {
                  var sum = 0;
                  for (var i in data) {
                      sum += data[i];
                  }
                  var rand = Math.floor(Math.random()*sum+1);
                  var partial_sum = 0;
                  var next = null;
                  for (var i in data) {
                      partial_sum += data[i];
                      if (partial_sum >= rand) { next = i; }
                  }
                  callback(next);
              });
          }
      });
  }

  randomSentence(callback) {
      var sentence = '';
      randomWord( function(word) {
          sentence = word;
          function build(next) {
              sentence += ' ' + next;
              if (/(\.|!|\?)/.exec(sentence)) {
                  sys.puts(sentence);
                  redis.close();
              } else
              { nextWord(next, build); }
          }
          build(word);
      });
  }

}
exports.markov = Markov 