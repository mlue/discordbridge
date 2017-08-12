'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var request = require('request');
var q = require('q')
var c = require('cheerio')


class Films {
  constructor(options){

  }

  getPlot(){
    var found = q.defer()
    function findPlot(){
      request('https://en.wikipedia.org/wiki/Special:RandomInCategory/English-language_films', function (error, response, body) {

        var parsedPage = c.load(body)
        console.log("parsing "+parsedPage('title').text())
        var hasPlot = parsedPage('#Plot')
        if(!hasPlot.html() && !parsedPage('#Plot').parent().next().text().match(/This section is empty\./)){
          setTimeout(() => {
            findPlot()
          },2000)}
        else found.resolve(parsedPage('#Plot').parent().next().text())
      })
    }
    findPlot()
    return found.promise
  }
}

exports.film = Films
