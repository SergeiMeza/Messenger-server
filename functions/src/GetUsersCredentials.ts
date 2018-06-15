import * as admin from 'firebase-admin'
import Const = require('./Constants')

const root = Const.root

export const onRequest = (req, res) => {
    const path = root + "credentials"
    admin.database().ref(path).once('value')
    .then((snap) => {
        if (!snap.exists()) {
            throw { description: "getUserCredentials: invalid path"}
        }
        res.status(200).send(snap.toJSON())
    })
    .catch((error) => {
        console.log(error)
        res.status(400).send(error)
    })
}