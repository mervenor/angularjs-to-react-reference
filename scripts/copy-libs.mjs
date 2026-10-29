// Copies the runtime libraries the original index.html expects into app/lib.
// This replaces the upstream `cpx` postinstall step; app/lib is git-ignored.
import { cpSync, existsSync, rmSync } from 'node:fs';

const libs = {
  angular: 'node_modules/angular',
  'angular-animate': 'node_modules/angular-animate',
  'angular-resource': 'node_modules/angular-resource',
  'angular-route': 'node_modules/angular-route',
  'bootstrap/dist': 'node_modules/bootstrap/dist',
  'jquery/dist': 'node_modules/jquery/dist',
};

if (!existsSync('app')) process.exit(0); // nothing to do once the legacy app has gone

rmSync('app/lib', { recursive: true, force: true });
for (const [target, source] of Object.entries(libs)) {
  if (existsSync(source)) cpSync(source, `app/lib/${target}`, { recursive: true });
}
