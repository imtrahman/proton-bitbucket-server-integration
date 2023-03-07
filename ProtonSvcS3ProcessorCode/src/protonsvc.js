/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION
const proton = new AWS.Proton()
var template_exist

async function protonsvc(templateName) {
    //var tname = process.env.PROTON_ENV_TEMPLATE
    var tname = templateName
    tname=tname.trim();
  // Getting the template name from Proton API  
    var envparams = {
    name: tname
    };
 
 try { 
    const data = await proton.getServiceTemplate(envparams).promise();
    console.log(data);
    template_exist = data.serviceTemplate.name // successful response
    console.log(template_exist);
    return template_exist
 } catch (ResourceNotFoundException) {
    console.log(ResourceNotFoundException);
    template_exist = null;
    return template_exist
}
}

module.exports = { protonsvc }








