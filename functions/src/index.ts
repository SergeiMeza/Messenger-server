import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import GetUsersCredentials = require('./api/get/GetUsersCredentials');
import PostNewUser = require('./PostNewUser')

admin.initializeApp()

export const getUserCredentials = functions.https.onRequest(GetUsersCredentials.onRequest)

export const postNewUser = functions.https.onRequest(PostNewUser.onRequest)