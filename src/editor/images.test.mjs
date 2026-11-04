import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { Readable } from 'node:stream';
import {execFileSync} from 'node:child_process';
import { createEditorApi } from './api.mjs';

async function fixture(t) {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'editor-images-'));
 t.after(() => fs.rm(root, {recursive:true, force:true}));
 const api = createEditorApi(root);
 const request = async (method, url, buffer) => {
  const req = Readable.from(buffer ? [buffer] : []); req.method=method; req.url=url;
  let body; const res={statusCode:200,setHeader(){},end(value){body=JSON.parse(value);}};
  await api(req,res,()=>{res.statusCode=404;body={error:'missing upload route'};});
  return {status:res.statusCode,body};
 };
 return {root, request, upload: buffer => request('POST','/images',buffer)};
}
const png = () => sharp({create:{width:2,height:2,channels:4,background:'red'}}).png().toBuffer();
test('binary image upload deduplicates and records migration metadata', async t => {
 const {root,upload}=await fixture(t); const bytes=await png();
 const first=await upload(bytes); assert.equal(first.status,201);
 const second=await upload(bytes); assert.equal(second.body.url,first.body.url);
 assert.match(first.body.url,/^\/images\/notes\/[a-f0-9]{64}\.png$/);
 assert.deepEqual(await fs.readFile(path.join(root,'public',first.body.url)),bytes);
 const manifest=JSON.parse(await fs.readFile(path.join(root,'public/images/notes/manifest.json'),'utf8'));
 assert.equal(manifest.version,1);
 assert.equal(manifest.assets[first.body.id].provider,'repository');
 assert.equal(manifest.assets[first.body.id].remoteUrl,null);
});

test('publish commits assets and manifest together with notes, excluding code changes',async t=>{
 const {root,upload,request}=await fixture(t);
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init');git('config','user.name','Test');git('config','user.email','test@example.test');
 await fs.mkdir(path.join(root,'src/content/notes'),{recursive:true});
 await fs.writeFile(path.join(root,'src/content/notes/test.md'),'original');
 await fs.writeFile(path.join(root,'code.js'),'original');
 git('add','.');git('commit','-m','base');
 const {body:asset}=await upload(await png());
 await fs.writeFile(path.join(root,'src/content/notes/test.md'),`![test](${asset.url})`);
 await fs.writeFile(path.join(root,'code.js'),'unrelated work');
 const result=await request('POST','/publish',Buffer.from(JSON.stringify({message:'images',push:false})));
 assert.equal(result.body.ok,true,JSON.stringify(result));
 assert.equal(git('show',`HEAD:${asset.path}`).length>0,true);
 assert.equal(git('show','HEAD:public/images/notes/manifest.json').includes(asset.id),true);
 assert.equal(git('show','HEAD:code.js'),'original');
 assert.equal(git('status','--porcelain'),'M code.js');
});
test('rejects invalid images and oversized uploads without writing assets', async t => {
 const {root,upload}=await fixture(t);
 assert.equal((await upload(Buffer.from('<svg></svg>'))).status,415);
 assert.equal((await upload(Buffer.alloc(10*1024*1024+1))).status,413);
 await assert.rejects(fs.access(path.join(root,'public/images/notes')));
});
test('concurrent uploads retain both manifest entries', async t => {
 const {root,upload}=await fixture(t);
 const a=await png(); const b=await sharp(a).jpeg().toBuffer();
 const results=await Promise.all([upload(a),upload(b)]);
 assert.ok(results.every(result=>result.status===201));
 const manifest=JSON.parse(await fs.readFile(path.join(root,'public/images/notes/manifest.json'),'utf8'));
 assert.equal(Object.keys(manifest.assets).length,2);
});
