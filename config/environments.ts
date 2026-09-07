import { Environment, EnvironmentConfig } from "../data";

export const DEFAULT_ENV: Environment = 'local';

export const environments: Record<Environment, EnvironmentConfig> = {
  local: {
    baseURL: 'http://localhost:4000/fashionhub/',
  },
  staging: {
    baseURL: 'https://staging-env/fashionhub/',
  },
  production: {
    baseURL: 'https://pocketaces2.github.io/fashionhub/',
  },
};

export function resolveEnvironment(): Environment {
  const env = process.env.ENV;
  if (env && env in environments) {
    return env as Environment;
  }
  if (env) {
    throw new Error(
      `Unknown environment: "${env}". Valid options are: ${Object.keys(environments).join(', ')}`
    );
  }
  return DEFAULT_ENV;
}
