import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import UserService = require('./UserService')
import PostService = require('./PostService')
import MessageService = require('./MessageService')
import LessonService = require('./LessonService')
import ImageService = require('./ImageService')
import LoginService = require('./LoginService')
import StripeService = require('./StripeService')
import { root } from './Constants';

admin.initializeApp()

// MARK: - LoginService
export const verifyLineToken = functions.https.onRequest(LoginService.lineLoginWithToken)

// MARK: - StripeService
export const createStripeCustomer = functions.auth.user().onCreate(StripeService.createStripeCustomer)
export const cleanupUser = functions.auth.user().onDelete(StripeService.cleanupUser)
export const chargeStripe = functions.database.ref(root + 'stripe/{userId}/charges/{chargeId}').onCreate(StripeService.chargeStripe)
export const addPaymentSource = functions.database.ref(root + 'stripe/{userId}/sources/{pushId}/token').onWrite(StripeService.addPaymentSource)

// MARK: - UserService
export const getAllUsersCredentials = functions.https.onRequest(UserService.getAllUserCredentials)
export const postNewUserCredentials = functions.https.onRequest(UserService.postNewUserCredentials)

// MARK: - PostService
export const getAllPosts = functions.https.onRequest(PostService.getAllPosts)
export const postNewUserPost = functions.https.onRequest(PostService.postNewUserPost)

// MARK: - MessageService
export const getMessagesForConversation = functions.https.onRequest(MessageService.postMessagesForConversation)
export const postNewMessage = functions.https.onRequest(MessageService.postNewMessage)

// MARK: - LessonService
export const postNewLesson = functions.https.onRequest(LessonService.postNewLesson)

// MARK: - ImageService
export const blurOffensiveImage = functions.storage.object().onFinalize(ImageService.blurOffensiveImage)