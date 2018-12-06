/*
* lambda.js
* This file is for an AWS Lamba function.
*/

require = require("esm")(module/*, options*/);
const uploadToS3 = require('./index.js').default;

exports.handler = async (event) => {
  await uploadToS3();

  const response = {
    statusCode: 200,
    body: JSON.stringify('Upload complete.'),
  };

  return response;
};
