import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const IMAGE_DIRECTORY = 'public/images/notes';
export const FOLLOWING_IMAGE_DIRECTORY = 'public/images/following';
export const IMAGE_DIRECTORIES = [IMAGE_DIRECTORY, FOLLOWING_IMAGE_DIRECTORY];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const pending = new Map();
const fail = (status, message) => Object.assign(new Error(message), {status});

/** Provider contract: put({id, bytes, extension}) -> {provider, path, url, remoteUrl}.
 * A future object-storage provider implements put; existing Markdown can be migrated
 * using manifest.assets[id].url -> remoteUrl without changing editor insertion logic.
 */
export function repositoryImageStorage(root, directory = IMAGE_DIRECTORY) {
 if (!IMAGE_DIRECTORIES.includes(directory)) throw fail(400, '图片目录不受支持');
 return {directory, async put({id, bytes, extension}) {
  const relative = `${directory}/${id}.${extension}`;
  await fs.mkdir(path.dirname(path.join(root, relative)), {recursive:true});
  await fs.writeFile(path.join(root, relative), bytes, {flag:'wx'}).catch(error => {
   if (error.code !== 'EEXIST') throw error;
  });
  return {provider:'repository',path:relative,url:`${directory.slice('public'.length)}/${id}.${extension}`,remoteUrl:null};
 }};
}

export async function storeImage(root, bytes, storage = repositoryImageStorage(root)) {
 if (!bytes.length) throw fail(415, '请选择 PNG、JPEG、WebP 或 GIF 图片');
 if (bytes.length > MAX_IMAGE_BYTES) throw fail(413, '单张图片不能超过 10 MiB');
 let metadata;
 try {
  const decoder = sharp(bytes, {limitInputPixels:40_000_000});
  metadata = await decoder.metadata();
  if (!['png','jpeg','webp','gif'].includes(metadata.format)) throw new Error('Unsupported format');
  await decoder.stats();
 } catch {
  throw fail(415, '图片无效或尺寸过大；支持 PNG、JPEG、WebP 和 GIF（最多 4000 万像素）');
 }
 const id = createHash('sha256').update(bytes).digest('hex');
 const extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
 // Serialize manifest read/modify/write for this project, including deduplicated uploads.
 const previous = pending.get(root) ?? Promise.resolve();
 const task = previous.catch(() => {}).then(async () => {
  const asset = await storage.put({id,bytes,extension});
  const file = path.join(root, storage.directory ?? IMAGE_DIRECTORY, 'manifest.json');
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(file,'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; manifest = {version:1,assets:{}}; }
  if (manifest.version !== 1 || !manifest.assets) throw new Error('图片清单格式不受支持');
  manifest.assets[id] = {id,...asset,bytes:bytes.length,width:metadata.width,height:metadata.height};
  await fs.mkdir(path.dirname(file),{recursive:true});
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
   await fs.writeFile(temporary,JSON.stringify(manifest,null,2)+'\n');
   await fs.rename(temporary,file);
  } finally { await fs.rm(temporary,{force:true}); }
  return manifest.assets[id];
 });
 pending.set(root,task);
 try { return await task; }
 finally { if (pending.get(root) === task) pending.delete(root); }
}
