import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  globalIgnores(['dist/*', 'src/shared/api/generated/*']),
  expoConfig,
  eslintPluginPrettierRecommended,
]);
