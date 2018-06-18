import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import path = require('path')
import os = require('os')
import fs = require('fs')
import mkdirp = require('mkdirp-promise')
import Const = require('./Constants')
import { spawn } from 'child_process';
const vision = require('@google-cloud/vision')()
const gcs = require('@google-cloud/storage')()

const root = Const.root

export const blurOffensiveImage = (object: functions.storage.ObjectMetadata, context: functions.EventContext) => {
    const file = gcs.bucket(object.bucket).file(object.name)

    // Check the image content using the Cloud Vision API
    return vision.detectSafeSearch(file)
    .then(data => {
        const safeSearch = data[0]
        const ref = admin.database().ref(root + 'LOGS/imageUpload').push()
        return ref.set({
            path: object.name,
            tags: safeSearch
        })
        .then(() => {
            if (safeSearch.adult || safeSearch.violence || safeSearch.spoof || safeSearch.medical) {
                return blurImage(object.name, object.bucket, object.metadata)
                }
            return null
        })
    })
}

function blurImage(filePath, bucketName, metadata) {
    const tempLocalFile = path.join(os.tmpdir(), filePath)
    const tempLocalDirectory = path.dirname(tempLocalFile)
    const bucket = gcs.bucket(bucketName)
    return mkdirp(tempLocalDirectory)
    .then(() => {
        return spawn('convert', [tempLocalFile, '-channel', 'RGBA', '-blur', '0x8', tempLocalFile])
    })
    .then(() => {
        return bucket.upload(tempLocalFile, {
            destination: filePath,
            metadata: {metadata}
        })
    })
    .then(() => {
        const ref = admin.database().ref(root + 'LOGS/blurImage').push()
        return ref.set({
            log: `Blurred image uploaded to storage`,
            filepath: filePath
        })
        .then(() => { fs.unlinkSync(tempLocalFile) })
    })
    .catch(error => {
        const ref = admin.database().ref(root + 'ERRORS/blurImage').push()
        return ref.set({
            function: `blurImage`,
            log: error
        })
    })
}