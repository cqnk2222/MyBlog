import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function setup(t) {
 const root = await mkdtemp(path.join(tmpdir(), 'editor-main-test-'));
 t.after(() => rm(root, { recursive: true, force: true }));
 const remote = path.join(root, 'remote.git');
 git(root, 'init', '--bare', remote);
 const repo = path.join(root, 'repo');
 git(root, 'clone', remote, repo);
 git(repo, 'config', 'user.name', 'Editor Test');
 git(repo, 'config', 'user.email', 'editor@example.test');
 git(repo, 'checkout', '-b', 'main');
 await writeFile(path.join(repo, 'page.txt'), 'base\n');
 git(repo, 'add', '.'); git(repo, 'commit', '-m', 'base'); git(repo, 'push', 'origin', 'main');
 git(repo, 'checkout', '-b', 'codex/test');
 return { repo, remote };
}
const load = async () => (await import('./git-publish.mjs')).mergeToMain;

test('publishes all committed code and content without touching dirty checkout', async t => {
 const {repo, remote} = await setup(t);
 await writeFile(path.join(repo, 'code.js'), 'committed code');
 git(repo, 'add', '.'); git(repo, 'commit', '-m', 'code');
 await writeFile(path.join(repo, 'page.txt'), 'uncommitted draft');
 const head = git(repo, 'rev-parse', 'HEAD');
 const result = await (await load())(repo);
 assert.equal(result.ok, true, JSON.stringify(result));
 assert.equal(git(remote, 'rev-parse', 'main'), head);
 assert.equal(git(repo, 'branch', '--show-current'), 'codex/test');
 assert.equal(await readFile(path.join(repo, 'page.txt'), 'utf8'), 'uncommitted draft');
 assert.equal(git(remote, 'show', 'main:code.js'), 'committed code');
});

test('conflicting histories leave remote main unchanged', async t => {
 const {repo, remote} = await setup(t);
 await writeFile(path.join(repo, 'page.txt'), 'main version');
 git(repo, 'checkout', 'main'); git(repo, 'add', '.'); git(repo, 'commit', '-m', 'main update'); git(repo, 'push', 'origin', 'main');
 const before = git(remote, 'rev-parse', 'main');
 git(repo, 'checkout', 'codex/test');
 await writeFile(path.join(repo, 'page.txt'), 'codex version');
 git(repo, 'add', '.'); git(repo, 'commit', '-m', 'conflict');
 const result = await (await load())(repo);
 assert.equal(result.ok, false);
 assert.equal(git(remote, 'rev-parse', 'main'), before);
 assert.equal(git(repo, 'branch', '--show-current'), 'codex/test');
});

test('rejects branches outside codex namespace', async t => {
 const {repo} = await setup(t);
 git(repo, 'checkout', 'main');
 const result = await (await load())(repo);
 assert.equal(result.ok, false);
 assert.match(result.note, /codex/);
});

test('merges divergent histories while retaining both sides', async t => {
 const {repo, remote} = await setup(t);
 git(repo, 'checkout', 'main');
 await writeFile(path.join(repo, 'remote.txt'), 'main work');
 git(repo, 'add', '.'); git(repo, 'commit', '-m', 'main work'); git(repo, 'push', 'origin', 'main');
 git(repo, 'checkout', 'codex/test');
 await writeFile(path.join(repo, 'code.js'), 'codex work');
 git(repo, 'add', '.'); git(repo, 'commit', '-m', 'codex work');
 const result = await (await load())(repo);
 assert.equal(result.ok, true, JSON.stringify(result));
 assert.equal(git(remote, 'show', 'main:remote.txt'), 'main work');
 assert.equal(git(remote, 'show', 'main:code.js'), 'codex work');
 assert.equal(git(remote, 'rev-list', '--parents', '-n', '1', 'main').split(' ').length, 3);
});
