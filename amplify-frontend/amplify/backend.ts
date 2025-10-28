import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
});

// Add permissions to authenticated users
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: [
      'polly:SynthesizeSpeech',
      'lambda:InvokeFunction',
    ],
    resources: [
      '*',
      'arn:aws:lambda:ap-northeast-2:533267442321:function:lambda-robo-controller-for-robo',
    ],
  })
);

// Add S3 permissions for robot detection images
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: [
      'arn:aws:s3:::industry-robot-detected-images/*',
    ],
  })
);

// Add permissions to unauthenticated users
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: [
      'polly:SynthesizeSpeech'
    ],
    resources: ['*'],
  })
);

// Export resources for frontend use
export const Resources = {
  UserPool: backend.auth.resources.userPool,
  UserPoolClient: backend.auth.resources.userPoolClient,
  GraphQLAPI: backend.data.resources.cfnResources.cfnGraphqlApi,
};
