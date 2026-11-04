/** Storage-independent insertion: upload(file) returns {url}. */
export async function insertImages({area, files, upload, onInsert, isCurrent}) {
 if (area.readOnly) throw new Error('图片正在上传，请稍候');
 if (!files.length) return;
 for (const file of files) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('支持 PNG、JPEG、WebP 和 GIF 图片');
  if (file.size > 10*1024*1024) throw new Error('单张图片不能超过 10 MiB');
 }
 const {value,selectionStart:start,selectionEnd:end}=area;
 area.readOnly=true;
 try {
  const markdown=[];
  for (const file of files) {
   const asset=await upload(file);
   const alt=(file.name || '图片').replace(/\.[^.]+$/,'').replace(/[\[\]\\\r\n]/g,' ').trim() || '图片';
   markdown.push(`![${alt}](${asset.url})`);
  }
  if (!isCurrent() || area.value !== value) throw new Error('正文已切换或修改，图片已保存，请在目标位置重新插入');
  const text=markdown.join('\n')+'\n';
  area.value=value.slice(0,start)+text+value.slice(end);
  area.focus();
  area.setSelectionRange(start+text.length,start+text.length);
  onInsert();
 } finally { area.readOnly=false; }
}
