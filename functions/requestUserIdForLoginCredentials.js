const admin = require('firebase-admin')
admin.initializeApp()

const database_root = "v0"

/*
	1. receives the user_uuid and the log_in_method
	2. checks in the database if the user is already registered
	3-1. if the user is registered return user_id

	3-2. if the user is not registered, create new user_id
	4. update user_id entry
	5. return user_id
	

*/

exports.onRequest = (request, response) => {
	
	let {log_in_id, log_in_method} = request.body

	if (log_in_id === undefined || log_in_method === undefined) {
		return httpErrorResponse(response, { "error": "invalid credentials" })
	}

	let path = `${database_root}/USER/credentials/${log_in_id}`

	let fetchUserCounter = admin.database().ref(path).once('value').then(snapshot => {
		if (snapshot.exists()) {
			let user_id = snapshot.val().user_id
			if (user_id) {
				return response.status(200).send({ "user_id": user_id })
			} else {
				return httpErrorResponse(response, { "error": "user_id not found" })
			}
		} else {
			return null
		}
	})

	return fetchUserCounter.then((response) => {
		if (response) {
			return response
		} 

		return admin.database()
		.ref(`${database_root}/CREDENTIALS/user_counter`)
		.once('value')
		.then(snapshot => {
			if (snapshot.exists()) {

				let user_id = snapshot.val()

				let promise1 = new Promise(admin
				.database()
				.ref(`${database_root}/CREDENTIALS/user_counter`)
				.set(user_id + 1))

				let promise2 = new Promise(admin
				.database()
				.ref(path)
				.set({
					"log_in_id": log_in_id,
					"log_in_method": log_in_method,
					"user_id": user_id
				}))

				return Promise.all([promise1, promise2]).then(() => { return response.status(200).send({ "user_id": user_id + 1 }) })
			} else {
				return httpErrorResponse(response, { "error": "user_counter not found" })
			}
		})	
	})
}

let httpErrorResponse = (response, error_message) => {
	return response.status(400).send(error_message)
}