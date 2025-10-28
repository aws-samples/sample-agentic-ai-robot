import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Amplify v6에서는 amplify_outputs.json을 직접 사용
Amplify.configure(outputs);

export { outputs as amplifyConfig };