const EventEmitter = require("events");
const emitter = new EventEmitter();

// Listener
emitter.on("time", (message) => {
  console.log("Time received:", message);
});


setInterval(() => {
  const time = new Date().toLocaleTimeString();
  emitter.emit("time", time);
}, 5000);

module.exports = emitter;