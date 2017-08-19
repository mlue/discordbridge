'use strict';

var request = require('request');
var q = require('q')
var c = require('cheerio')


class Games {
  constructor(options){

  }



  getGame(){
    var found = q.defer()
    function findGame(){
      request('https://en.wikipedia.org/wiki/Special:RandomInCategory/Multiplayer_and_single-player_video_games', function (error, response, body) {
        if(error){console.log(error);setTimeout(timeoutRequest, 2000)}
        else{
          var parsedPage = c.load(body)
          console.log("parsing "+parsedPage('title').text())
          found.resolve({title: parsedPage('title').text().replace(/Wikipedia/,'')})}
      })
    }
    function timeoutRequest (){
      console.log("tryin again")
      findGame()
    }
    findGame()
    return found.promise
  }
}

module.exports = new Games()
