'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Godot {
  constructor(options){
    this.script = {
      'hello dolly': "hello polly",
      'hello polly': "hello dolly"
    }

  }

  play(f){
    return this.script[f]
  }
}

exports.Godot = Godot
