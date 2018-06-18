import * as admin from 'firebase-admin'
import path = require('path')
import os = require('os')
import fs = require('fs')
import mkdirp = require('mkdirp-promise')
import Const = require('./Constants')
const spawn = require('child-process-promise').spawn;
const vision = require('@google-cloud/vision')()
const gcs = require('@google-cloud/storage')()

const root = Const.root

/**
 * When an image is uploaded we check if it is flagged as Adult or Violence by the Cloud Vision
 * API and if it is we blur it using ImageMagick.
 */
export const blurOffensiveImage = (object) => {
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

/**
 * Blurs the given image located in the given bucket using ImageMagick.
 */
function blurImage(filePath, bucketName, metadata) {
    const tempLocalFile = path.join(os.tmpdir(), filePath)
    const tempLocalDirectory = path.dirname(tempLocalFile)
    const bucket = gcs.bucket(bucketName)

    // Create the temp directory where the storage file will be downloaded.
    return mkdirp(tempLocalDirectory)
    .then(() => {
        // Download file from bucket.
        return bucket.file(filePath).download({destination: tempLocalFile})
    })
    .then(() => {
        // Blur the image using ImageMagick.
        return spawn('convert', [tempLocalFile, "-colorspace", "Gray", '-channel', 'RGBA', '-blur', '0x8', tempLocalFile])
    })
    .then(() => {
        return bucket.upload(tempLocalFile, {
            destination: filePath,
            metadata: {metadata}
        })
    })
    .then(() => {
        const ref = admin.database().ref(root + 'LOGS/blurImage').push()
        fs.unlinkSync(tempLocalFile)
        return ref.set({
            log: `Blurred image uploaded to storage`,
            filepath: filePath
        })
    })
    .catch(error => {
        const ref = admin.database().ref(root + 'ERRORS/blurImage').push()
        return ref.set({
            function: `blurImage`,
            error: error
        })
    })
}