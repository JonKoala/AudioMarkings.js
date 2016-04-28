
function Emitter(context) {
  AudioWM.call(this, context);

  this.oscillator = this.context.createOscillator();
  this.oscillator.start();

  this.initialize(); //initializes with default behavior
}
Emitter.prototype = Object.create(AudioWM.prototype);
Emitter.prototype.initialize = function(start, mdc, bitLength) {

  //default behavior
  start = (isNaN(start)) ? this.defaultMessageParameters.start : start;
  mdc = (isNaN(mdc)) ? this.defaultMessageParameters.mdc : mdc;
  bitLength = (isNaN(bitLength)) ? this.defaultMessageParameters.bitLength : bitLength;

  this.signals = this.createSignalsArray(start, mdc, bitLength);
  this.oscillator.frequency.value = mdc;
}
Emitter.prototype.setMessage = function(message) {
  this.oscillator.setPeriodicWave(this.signals[message]);
}
Emitter.prototype.start = function() {
  this.oscillator.connect(this.context.destination);
}
Emitter.prototype.stop = function() {
  this.oscillator.disconnect(this.context.destination);
}

Emitter.prototype.defaultMessageParameters = {
  start: 19000,
  mdc: 200,
  bitLength: 5
}
