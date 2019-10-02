global.fetch = require('node-fetch');

const promiseFinally = require('promise.prototype.finally');

promiseFinally.shim();
