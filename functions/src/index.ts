import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import GetUsersCredentials = require('./GetUsersCredentials');
import PostNewUserCredentials = require('./PostNewUserCredentials')
import Const = require('./Constants')

const root = Const.root

admin.initializeApp()

// returns all the user credentials
export const getUsersCredentials = functions.https.onRequest(GetUsersCredentials.onRequest)

export const postNewUserCredentials = functions.https.onRequest(PostNewUserCredentials.onRequest)

export const postNewUserPost = functions.https.onRequest((req, res) => {
    const {user_id, contents} = req.body
    if (!user_id || !contents) {
        return res.status(400).send({error: "invalid post contents"})
    }
    const posts_path = root + `/posts`
    let post_ref = admin.database().ref(posts_path).push()
    let timestamp = new Date()
    let object_id = post_ref.key
    const post = {user_id, contents, timestamp, object_id}
    return post_ref.set(post)
    .then(error => {
        if (error) {
            return res.status(400).send({ error: "could not upload post to database"})
        }
        return res.status(200).send(post)
    })
    .catch((error) => {
        console.log(error)
        res.status(400).send(error)
    })
})

export const getPosts = functions.https.onRequest((req, res) => {
    const path = root + "/posts"
    admin.database().ref(path).once('value')
    .then((snap) => {
        if (!snap.exists()) {
            throw { error: "getPosts: invalid path"}
        }
        res.status(200).send(snap.toJSON())
    })
    .catch((error) => {
        console.log(error)
        res.status(400).send(error)
    })  
})