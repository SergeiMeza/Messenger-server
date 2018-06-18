import * as admin from 'firebase-admin'
import Const = require('./Constants')

const root = Const.root

export const getAllPosts = (req, res) => {
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
}

export const postNewUserPost = (req, res) => {
    const {user_id, contents, type} = req.body
    if (!user_id || !contents || !type) {
        return res.status(400).send({error: "invalid post contents"})
    }
    const posts_path = root + `/posts`
    const post_ref = admin.database().ref(posts_path).push()
    const timestamp = new Date().toISOString()
    const object_id = post_ref.key
    const post = {user_id, contents, timestamp, type, object_id}
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
}

