import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import Const = require('./Constants')
import UserService = require('./UserService')
import PostService = require('./PostService')
import MessageService = require('./MessageService')
import LessonService = require('./LessonService')
import ImageService = require('./ImageService')


const root = Const.root

admin.initializeApp()

// MARK: - LoginService

// MARK: - UserService
export const getAllUsersCredentials = functions.https.onRequest(UserService.getAllUserCredentials)
export const postNewUserCredentials = functions.https.onRequest(UserService.postNewUserCredentials)

// MARK: - PostService
export const getAllPosts = functions.https.onRequest(PostService.getAllPosts)
export const postNewUserPost = functions.https.onRequest(PostService.postNewUserPost)

// MARK: - MessageService
export const getMessagesForConversation = functions.https.onRequest(MessageService.getMessagesForConversation)
export const postNewMessage = functions.https.onRequest(MessageService.postNewMessage)

// MARK: - LessonService
export const postNewLesson = functions.https.onRequest(LessonService.postNewLesson)

// MARK: - ImageService
export const blurOffensiveImage = functions.storage.object().onFinalize(ImageService.blurOffensiveImage)