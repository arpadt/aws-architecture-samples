const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();

const forEachAsync = (fn, arr) => arr.reduce((promise, value) => promise.then(() => fn(value)), Promise.resolve());

const processAgents = async (s3Record) => {
  const { bucket, object } = s3Record.s3;

  const params = {
    Bucket: bucket.name,
    Key: object.key,
  };

  let agentData;
  try {
    const agentDataBuffer = (await s3.getObject(params).promise()).Body;
    agentData = JSON.parse(agentDataBuffer.toString());
  } catch (error) {
    console.error('An error occurred while getting agent object: ', error.message);
    throw error;
  }

  console.log(`Agent ${agentData.name} is being processed...`);
  // further process data here
};

const getIndividualRecords = async (record) => {
  const body = JSON.parse(record.body);
  await forEachAsync(processAgents, body.Records);
};

exports.handler = async (event) => {
  const records = event.Records;

  if (!records || !records.length) {
    console.log('No message to process');
    return;
  }

  return forEachAsync(getIndividualRecords, records);
}
