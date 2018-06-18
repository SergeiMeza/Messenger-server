import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as rp from 'request-promise'
import cookieParser = require('cookie-parser')
import crypto = require('crypto')

export const verifyInstagramToken = (req, res) => {
  if (!req.body.token) {
    return res.status(400).send({error: "Access Token not found"})
  }
  const { token } = req.body

}


// Verify LINE token and exchange for Firebase Custom Auth token
export const verifyLineToken = (req, res) => {
    if (!req.body.token) {
      return res.status(400).send({error: "Access Token not found"})
    }
  
    const { token } = req.body
  
    // Verify LINE access token with LINE server then generate Firebase Custom Auth token
    verifyToken(token)
    .then(customAuthToken => {
        return res.status(200).send({ firebase_token: customAuthToken })
    })
    .catch(err => {
        // If LINE access token verification failed, return error response to client
        console.error('LINE token verification failed: ', err);
        return res.status(403).send({ error_message: 'Authentication error: Cannot verify access token.' });
    });
}

/**
 * Verify LINE access token and return a custom auth token allowing signing-in 
 * the corresponding Firebase account.
 *
 * Here are the steps involved:
 *  1. Verify with LINE server that a LINE access token is valid
 *  2. Check if a Firebase user corresponding to the LINE user already existed.
 *  If not, fetch user profile from LINE and generate a corresponding Firebase user.
 *  3. Return a custom auth token allowing signing-in the Firebase account.
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
function verifyToken(token): Promise<string> {

    // Send request to LINE server for access token verification
    const verifyTokenOptions = generateLineApiRequest('https://api.line.me/v1/oauth/verify', token)
  
    // STEP 1: Verify with LINE server that a LINE access token is valid
    return rp(verifyTokenOptions)
    .then(response => {
        // Verify the token’s channelId match with my channelId to prevent spoof attack
        // <IMPORTANT> As LINE's Get user profiles API response doesn't include channelID,
        // you must not skip this step to make sure that the LINE access token is indeed
        // issued for your channel.
        if (response.channelId !== functions.config().line.channelid) {
          return Promise.reject(new Error('LINE channel ID mismatched'))
        }
  
        // STEP 2: Access token validation succeeded, so look up the corresponding Firebase user
        const lineMid = response.mid
        return getFirebaseUser(lineMid, token)
      })
    .then(userRecord => {
        // STEP 3: Generate Firebase Custom Auth Token
        return admin.auth().createCustomToken(userRecord.uid)
        .then(token => {
          return token
        })
      })
  }
  
// Generate a Request option to access LINE APIs
function generateLineApiRequest(apiEndpoint, token) {
    return {
      url: apiEndpoint,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      json: true
    }
}
  
  /**
   * Look up Firebase user based on LINE's mid. If the Firebase user does not exist,
   + fetch LINE profile and create a new Firebase user with it.
   *
   * @returns {Promise<UserRecord>} The Firebase user record in a promise.
   */
  function getFirebaseUser(lineMid, lineAccessToken) {
    // Generate Firebase user's uid based on LINE's mid
    const firebaseUid = `line:${lineMid}`;
  
    // LINE's get user profile API endpoint
    const getProfileOptions = generateLineApiRequest('https://api.line.me/v1/profile', lineAccessToken);
  
    return admin.auth().getUser(firebaseUid)
    .catch(error => {
      // If user does not exist, fetch LINE profile and create a Firebase new user with it
      if (error.code === 'auth/user-not-found') {
        return rp(getProfileOptions).then(response => {
          // Parse user profile from LINE's get user profile API response
            const photoURL: string = response.pictureUrl ? response.pictureUrl : ""
            const displayName: string = response.displayName ? response.displayName : ""
            const uid: string = firebaseUid
          // Create a new Firebase user with LINE profile and return it
          return admin.auth().createUser({ photoURL, displayName, uid })
        })
      }
      // If error other than auth/user-not-found occurred, fail the whole login process
      throw error
    })
  }