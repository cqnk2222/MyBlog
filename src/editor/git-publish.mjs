import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const exec = promisify(execFile);

/** Merge a pinned committed codex HEAD in an isolated clone; never force-push. */
export async function mergeToMain(projectRoot) {
 const steps = [];
 let temporary;
 const run = async (cwd, args) => {
  try {
   const {stdout, stderr} = await exec('git', args, {
    cwd, timeout: 120000, maxBuffer: 8 * 1024 * 1024,
    env: {...process.env, GIT_TERMINAL_PROMPT: '0', GIT_MERGE_AUTOEDIT: 'no'},
   });
   steps.push({ok: true, command: `git ${args.join(' ')}`, stdout, stderr});
   return stdout.trim();
  } catch (error) {
   steps.push({ok: false, command: `git ${args.join(' ')}`, stdout: error.stdout || '', stderr: error.stderr || error.message});
   throw error;
  }
 };
 try {
  const branch = await run(projectRoot, ['branch', '--show-current']);
  if (!branch.startsWith('codex/')) return {ok: false, steps, note: '仅支持从 codex/ 分支合并到 main。'};
  const head = await run(projectRoot, ['rev-parse', 'HEAD']);
  const remote = await run(projectRoot, ['remote', 'get-url', '--push', 'origin']);
  const identity = await run(projectRoot, ['var', 'GIT_COMMITTER_IDENT']);
  const match = identity.match(/^(.*) <([^>]+)> /);
  if (!match) throw new Error('无法读取 Git 提交身份');
  temporary = await mkdtemp(path.join(tmpdir(), 'note-editor-main-'));
  const clone = path.join(temporary, 'repo');
  await run(projectRoot, ['clone', '--shared', '--no-checkout', '--', projectRoot, clone]);
  await run(clone, ['remote', 'set-url', 'origin', remote]);
  await run(clone, ['fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main']);
  await run(clone, ['checkout', '--detach', 'refs/remotes/origin/main']);
  await run(clone, ['-c', `user.name=${match[1]}`, '-c', `user.email=${match[2]}`, 'merge', '--no-edit', head]);
  await run(clone, ['push', 'origin', 'HEAD:refs/heads/main']);
  return {ok: true, steps, note: `已将 ${branch} 合并并推送到 main。当前编辑分支保持不变。`};
 } catch (error) {
  return {ok: false, steps, note: '发布到 main 未完成。请查看日志；若有冲突或远端更新，请处理后重试。', error: error.message};
 } finally {
  if (temporary) await rm(temporary, {recursive: true, force: true});
 }
}
