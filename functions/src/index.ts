const functions = require('firebase-functions')
const helloWorld = require('./helloWorld.js')
const requestUserIdForLoginCredentials = require('./requestUserIdForLoginCredentials.js')


exports.helloWorld = functions.https.onRequest(helloWorld.onRequest)

exports.requestUserIdForLoginCredentials = functions.https.onRequest(requestUserIdForLoginCredentials.onRequest)

