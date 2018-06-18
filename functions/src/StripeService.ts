import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as Stripe from 'stripe'
import { root } from './Constants';

const stripe = new Stripe(functions.config().stripe.token)
const currency = functions.config().stripe.currency || 'JPY';

// root/stripe/{user}/stripe_id
export const createStripeCustomer = (user: admin.auth.UserRecord, context: functions.EventContext) => {
    let options = {    
        account_balance: 0,
        tax_percent: 10
    }
    return stripe.customers.create(options)
    .then(customer => {
        return admin.database().ref(root + `stripe/${user.uid}/stripe_id`).set(customer.id)
    })
    .catch(error => {
        console.log(error)
    })
}

// root/stripe/{userId}/charges/{chargeId}
export const chargeStripe = (snapshot: functions.database.DataSnapshot, context: functions.EventContext) => {
    if (!snapshot.exists()) {
        return Promise.reject({error: "snapshot empty"})
    }
    const val = snapshot.val()
    if (val.id || val.error ) {
        return Promise.reject({error: "charge already processed)"})
    }
    // look for stripe customer id
    return admin.database().ref(root + `stripe/${context.params.userId}/stripe_id`).once('value')
    .then(snap => {
        if (snap.exists()) {
            return snap.val()
        }
        throw { error: "stripe_id not found."}
    })
    .then(customer => {
        const amount = val.amount
        const idempotency_key = context.params.chargeId
        const source = val.source
        const charge = { amount, currency, customer, source }
        return stripe.charges.create(charge, {idempotency_key})
    })
    .then(response => {
        return snapshot.ref.set(response)
    })
    .catch(error => {
        return snapshot.ref.child('error').set(userFacingMessage(error))
    })
}

// export const test = functions.database.ref().onWrite()

// root/stripe/{user_id}/sources/{push_id}/token
// Add a payment source (card) for a user by writing a stripe payment source token to Realtime database
export const addPaymentSource = (change: functions.Change<functions.database.DataSnapshot>, context: functions.EventContext) => {
    const source = change.after.val()
    if (!source) {
        return null
    }
    return admin.database().ref(root + `stripe/${context.params.userId}/stripe_id`).once('value')
    .then((snapshot) => {
        return snapshot.val()
    })
    .then((customer) => {
        return stripe.customers.createSource(customer, {source})
    })
    .then((response) => {
        return change.after.ref.parent.set(response)
    }, (error) => {
        return change.after.ref.parent.child('error').set(userFacingMessage(error))
    })
}

export const cleanupUser = (user) => {
    return admin.database().ref(root + `/stripe/${user.uid}`).once('value')
    .then((snap) => {
        return snap.val()
    }).then((customer) => {
        return stripe.customers.del(customer.customer_id)
    }).then(() => {
        return admin.database().ref(root + `stripe/${user.uid}`).remove()
    })
}

function userFacingMessage(error) {
    return error.type ? error.message : 'An error occurred, developers have been alerted';
}