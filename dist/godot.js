'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Godot {
  constructor(options){
    this.script = {}
  }

  play(f){
    return this.script[f]
  }
}

exports.Godot = Godot
