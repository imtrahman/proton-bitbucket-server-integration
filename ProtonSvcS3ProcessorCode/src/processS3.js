/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const { compareS3 } = require('./compareS3')
const { deleteS3 } = require('./deleteS3')
const { protonsvc } = require('./protonsvc')

const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION
const s3 = new AWS.S3()
const proton = new AWS.Proton()

const processS3 = async (record) => {
  try {
    // Decode URL-encoded key
    const Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))
    console.log(Key)

    // Get the list of object versions
    const data = await s3.listObjectVersions({
      Bucket: record.s3.bucket.name,
      Prefix: Key
    }).promise()

  const cparam = {
   Bucket: record.s3.bucket.name,
   Key: Key
  }
  const metaData = await s3.headObject(cparam).promise();
  console.log ('Showing Meta data')
  console.log(metaData)
  let commitID;
  let commitHash = metaData.Metadata.commithash


    console.log (JSON.stringify(data, null, 2))
    
   // Sort versions by date (ascending by LastModified)
    const versions = data.Versions
    const sortedVersions = versions.sort((a,b) => new Date(a.LastModified) - new Date(b.LastModified))

    // Add version number
    for (let i = 0; i < sortedVersions.length; i++) {
      sortedVersions[i].VersionNumber = i + 1
      sortedVersions[i].BucketName = record.s3.bucket.name
    }
    console.log(sortedVersions)
    
    // Get diff of last two versions
    const [isMinorVersion, hversion] = await compareS3(sortedVersions[sortedVersions.length - 2], sortedVersions[sortedVersions.length - 1])
    
    console.log('isMinorVersion: ', isMinorVersion)
    console.log('isMajorVersion: ', !isMinorVersion)
    console.log(hversion)
    
    
   let majorVersion;
   var path = require("path");
   commitID = commitHash.slice(0,7);

    if(isMinorVersion) {
    majorVersion = hversion
    }
    
	console.log(commitID)
    
    var params = {
    source: { /* required */
    s3: {
      bucket: record.s3.bucket.name, 
      key: Key
    }
  },

  templateName: process.env.PROTON_SVC_TEMPLATE,
  description: `Syncing Commit Hash - [${commitID}]`,
  majorVersion: majorVersion,
  };

  var createsvcvtemparams = {
  name: process.env.PROTON_SVC_TEMPLATE, /* required */
  description: process.env.PROTON_SVC_TEMPLATE,
  displayName: process.env.PROTON_SVC_TEMPLATE,
   
};

  const isTemplateExist = await protonsvc(process.env.PROTON_ENV_TEMPLATE)
  console.log(isTemplateExist)

  if(isTemplateExist == process.env.PROTON_SVC_TEMPLATE){
   let protonResponse = await proton.createServiceTemplateVersion(params).promise();
    console.log(protonResponse)  
  }else {
   let protonResponse = await proton.createServiceTemplate(createsvcvtemparams).promise();
   console.log(protonResponse)
  }
    

    // Only continue there are more versions that we should keep
    if (data.Versions.length <= process.env.KEEP_VERSIONS) {
      return console.log("Not enough versions for deletion - exit")
    }

    // Delete older versions
    await deleteS3(sortedVersions)
    
  } catch (err) {
    console.error(err)
  }
}

module.exports = { processS3 }



