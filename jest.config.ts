import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
  '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    "@parsers/(.*)": "<rootDir>/src/lib/parsers/$1",
    "@models/(.*)": "<rootDir>/src/models/$1",
    "@lib/(.*)": "<rootDir>/src/lib/$1",
    "@api/(.*)": "<rootDir>/src/api/$1"
  },
  preset: "@shelf/jest-dynamodb",
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 50000
};

export default config;