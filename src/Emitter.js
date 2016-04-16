
function Emitter(context) {
  AudioWM.call(this, context);

  this.oscillator = this.context.createOscillator();
  this.oscillator.start();
}
Emitter.prototype = Object.create(AudioWM.prototype);
Emitter.prototype.initialize = function(start, mdc, bitLength) {
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
