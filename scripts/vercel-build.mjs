import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Run where Vercel's production secrets are available, without exporting them.
// Preview builds must never migrate the production database.
if (process.env.VERCEL_ENV === 'production' && process.env.TURSO_DATABASE_URL) {
  run(process.execPath, ['scripts/migrate.mjs']);
}

run('npm', ['run', 'build']);
