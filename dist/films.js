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
        var textNodes = parsedPage('#Plot').parent().next()
        var text = ''
        while(textNodes.is('p')){
          text += textNodes.text()+"\n\n"
          textNodes = textNodes.next()
        }
        if(!hasPlot.html() || text.length < 90 ){
          setTimeout(() => {
            findPlot()
          },2000)}
        else found.resolve({title: parsedPage('title').text().replace(/Wikipedia/),body: text+"\n ~fin~"})
      })
    }
    findPlot()
    return found.promise
  }
}

exports.film = Films
