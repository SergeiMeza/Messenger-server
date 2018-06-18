import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { root } from './Constants';

export const postNewMessage = (req: functions.Request, res: functions.Response) => {
    const {sender_id, receiver_ids, content, type} = req.body
    if (!sender_id || !receiver_ids || !content || !type) {
        return res.status(400).send({error: "invalid message format"})
    }
    const timestamp = new Date().toISOString()
    const conversation_id = [sender_id, receiver_ids].sort().reduce((total, nextValue) => {
        return total ? total + "-" + nextValue : nextValue
    }, "")
    const conversation_path = root + `/conversations/${conversation_id}`
    const message_ref = admin.database().ref(conversation_path).push()
    const object_id = message_ref.key
    const message = {conversation_id, object_id, sender_id, receiver_ids, content, type, timestamp}
    return message_ref.update(message)
    .then(error => {
        if (error) {
            return res.status(400).send({ error: "could not upload message to database"})
        }
        return res.status(200).send(message)
    })
    .catch((error) => {
        console.log(error)
        res.status(400).send(error)
    })
}

export const postMessagesForConversation = (req: functions.Request, res:functions.Response) => {
    const {conversation_id} = req.body
    if (!conversation_id) {
        return res.status(400).send({error: "invalid get request format"})
    }
    const conversation_path = root + `/conversations/${conversation_id}`
    return admin.database().ref(conversation_path).once('value')
    .then(snap => {
        if (snap.exists()) {
            return res.status(200).send(snap.toJSON())
        }
        return res.status(400).send({error: "conversation is empty"})
    })
    .catch(error => {
        return res.status(500).send({error})
    })
}