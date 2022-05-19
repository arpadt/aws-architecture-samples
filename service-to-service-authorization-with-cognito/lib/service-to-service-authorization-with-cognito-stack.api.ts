import { APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  console.log('Request received');
  // get some data from the database
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    isBase64Encoded: false,
    body: JSON.stringify({
      file1: {
        name: 'James Bond',
      },
      file2: {
        name: 'Harry Potter',
      },
    }),
  };
};
