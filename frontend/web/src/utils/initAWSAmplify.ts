import { Amplify } from "aws-amplify";

const NEXT_PUBLIC_APP_REGION = process.env.NEXT_PUBLIC_APP_REGION;
const NEXT_PUBLIC_APP_COGNITO_POOL_ID =
  process.env.NEXT_PUBLIC_APP_COGNITO_POOL_ID;
const NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID =
  process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID;

export const initAWSAmplify = () => {
  Amplify.configure({
    Auth: {
      region: NEXT_PUBLIC_APP_REGION,
      userPoolId: NEXT_PUBLIC_APP_COGNITO_POOL_ID,
      userPoolWebClientId: NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      //   oauth: {
      //     redirectSignIn: VITE_APP_URL,
      //     redirectSignOut: `${VITE_APP_URL}/login`,
      //     scope: ["email", "openid", "aws.cognito.signin.user.domain"],
      //     responseType: "code",
      //   },
    },
  });
};
