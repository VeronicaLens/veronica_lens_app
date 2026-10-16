import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './contracts/openapi.v1.yaml',
  output: './src/shared/api/generated',
  plugins: ['@hey-api/typescript'],
});
