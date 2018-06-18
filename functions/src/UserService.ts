import * as admin from 'firebase-admin'
import Const = require('./Constants')

const root = Const.root

export const getAllUserCredentials = (req, res) => {
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


export const postNewUserCredentials = (req, res) => {
    const { uuid, login_method } = req.body
    if (!uuid) {
        return res.status(400).send({ error: "postNewUser: invalid uuid" })
    }
    const credentials_path = root + `credentials/${uuid}`
    return admin.database().ref(credentials_path).once('value')
    .then(snap => {
        if (snap.exists()) {
            return res.status(200).send(snap.toJSON())
        }
        const user_id_path = root + `var/user_id`
        return admin.database().ref(user_id_path).once('value')
        .then(snaphot => {
            const credentials = { 
                uuid: uuid,
                login_method: login_method ? login_method : "unkown",
                id: snaphot.val() ? snaphot.val() : 1001
            }
            const p1 = admin.database().ref(root + `credentials/${uuid}`).update(credentials)
            const p2 = admin.database().ref(user_id_path).set(snaphot.val() ? snaphot.val() + 1: 1001)
            return Promise.all([p1, p2]).then(() => res.status(200).send(credentials))
        })
        .catch(error => {
            res.status(400).send({ error: "could not find var/user_id"})
        })
    })
    .catch(error => {
        res.status(400).send({ error: "could not find credentials"})
    })
}