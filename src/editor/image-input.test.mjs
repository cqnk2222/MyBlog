import {test} from 'node:test';
import assert from 'node:assert/strict';
const load=async()=> (await import('./image-input.mjs')).insertImages;
const area=()=>({value:'before after',selectionStart:7,selectionEnd:7,readOnly:false,focus(){},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}});
test('inserts uploaded Markdown at cursor and preserves surrounding text',async()=>{
 const input=area(); let changed=0;
 await (await load())({area:input,files:[{type:'image/png',name:'shot.png',size:20}],upload:async()=>({url:'/images/notes/id.png'}),onInsert:()=>changed++,isCurrent:()=>true});
 assert.equal(input.value,'before ![shot](/images/notes/id.png)\nafter'); assert.equal(changed,1); assert.equal(input.readOnly,false);
});
test('failed uploads leave body unchanged and unlock input',async()=>{
 const input=area();
 await assert.rejects((await load())({area:input,files:[{type:'image/png',name:'a.png',size:20}],upload:async()=>{throw Error('offline');},onInsert(){},isCurrent:()=>true}),/offline/);
 assert.equal(input.value,'before after'); assert.equal(input.readOnly,false);
});
test('switching document during upload never inserts into the other note',async()=>{
 const input=area(); let current=true;
 await assert.rejects((await load())({area:input,files:[{type:'image/png',name:'a.png',size:20}],upload:async()=>{current=false;input.value='another note';return {url:'/image.png'};},onInsert(){assert.fail();},isCurrent:()=>current}));
 assert.equal(input.value,'another note');
});
