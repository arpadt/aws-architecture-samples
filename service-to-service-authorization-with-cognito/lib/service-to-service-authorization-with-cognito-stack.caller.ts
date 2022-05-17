import axios from 'axios';

const {
  APP_CLIENT_ID,
  APP_CLIENT_SECRET,
  FILES_SERVICE_URL = '',
  COGNITO_DOMAIN,
} = process.env;

interface CognitoClientCredentials {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const getCredentials = async (): Promise<CognitoClientCredentials> => {
  const authUrl = `${COGNITO_DOMAIN}/oauth2/token`;
  const authRequestBody = new URLSearchParams({
    grant_type: 'client_credentials',
  });

  const authParams = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${APP_CLIENT_ID}:${APP_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
  };

  const { data } = await axios.post<CognitoClientCredentials>(
    authUrl,
    authRequestBody,
    authParams
  );
  console.log('Successfully received access token');
  return data;
};

export const handler = async () => {
  try {
    const { access_token: accessToken } = await getCredentials();

    const { data: files } = await axios.get(FILES_SERVICE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('Successfully received data: ', files);
    return files;
  } catch (error) {
    console.log('An error occurred', error);

    throw error;
  }
};
