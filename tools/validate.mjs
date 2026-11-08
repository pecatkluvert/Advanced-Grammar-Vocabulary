import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUnit, safeRelativePath, allQuestions } from '../core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
let errors=[];let words=0,questions=0;
try {
 const manifest=await read('data/units.json');
 if(manifest.schemaVersion!==1||!Array.isArray(manifest.units)||!manifest.units.length)throw Error('Invalid unit index');
 const ids=new Set(),numbers=new Set();
 for(const entry of manifest.units){
  if(!safeRelativePath(entry.file))throw Error('Unsafe unit file path');
  const unit=await read(`data/${entry.file}`);
  errors.push(...validateUnit(unit).map(e=>`${entry.file}: ${e}`));
  if(unit.id!==entry.id)errors.push(`${entry.file}: ID differs from manifest`);
  if(ids.has(unit.id)||numbers.has(unit.number))errors.push(`${entry.file}: duplicate unit ID or number`);
  ids.add(unit.id);numbers.add(unit.number);
  words+=unit.vocabulary.length;questions+=allQuestions(unit).length;
 }
 const audio=await read('data/audio-library.json');
 if(!safeRelativePath(audio.basePath)||!Array.isArray(audio.tracks))errors.push('Invalid audio index');
 for(const t of audio.tracks||[])if(!safeRelativePath(t.file))errors.push(`Unsafe track name: ${t.file}`);
 console.log(`${manifest.units.length} units · ${words} vocabulary entries · ${questions} written questions · ${audio.tracks.length} audio filenames`);
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('All content checks passed. MP3 recordings are optional and are not bundled.');
}catch(error){console.error(error.message);process.exitCode=1;}
