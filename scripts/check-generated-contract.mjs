import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['status', '--porcelain', '--', 'src/shared/api/generated'], {
  encoding: 'utf8',
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

if (result.stdout.trim()) {
  console.error('Generated API types are out of date:');
  console.error(result.stdout.trim());
  console.error('Run npm run contract:generate and commit the result.');
  process.exit(1);
}

console.log('Generated API types are up to date.');
