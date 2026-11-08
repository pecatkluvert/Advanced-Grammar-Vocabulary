import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { accepts, allQuestions, unitStats, normalise, cleanProgress, validateUnit, safeRelativePath } from '../core.js';
const read=async name=>JSON.parse(await fs.readFile(new URL(`../${name}`,import.meta.url),'utf8'));
const manifest=await read('data/units.json');
const units=await Promise.all(manifest.units.map(e=>read(`data/${e.file}`)));
test('all unit content and answer keys are structurally valid',()=>{
 for(const u of units){assert.deepEqual(validateUnit(u),[]);for(const {question:q} of allQuestions(u)){const answers=Array.isArray(q.answer)?q.answer:[q.answer];for(const a of answers)assert.equal(accepts(q,a),true);assert.equal(accepts(q,'unrelated answer 123'),false);}}
});
test('normalisation accepts harmless variation, while retaining meaningful spelling',()=>{
 assert.equal(normalise('  DUCK’S   back. '),"duck's back");
 assert.equal(accepts({answer:["lion's",'lions']},'LION’S'),true);
 assert.equal(accepts({answer:'fair and square'},'fair & square'),false);
 assert.equal(accepts({answer:'irresponsible'},'irresponible'),false);
 assert.equal(accepts({answer:'middle-of-the-road'},'middle‑of‑the‑road'),true);
});
test('progress counts latest results, ignores stale keys, and does not count listening as written mastery',()=>{
 const u=units[0],qs=allQuestions(u),answers={stale:{correct:true},[qs[0].key]:{correct:true},[qs[1].key]:{correct:false}};
 assert.equal(unitStats(u,answers).attempted,2);assert.equal(unitStats(u,answers).correct,1);
 answers[qs[1].key].correct=true;assert.equal(unitStats(u,answers).correct,2);
});
test('backup import keeps valid values and rejects malformed answer data',()=>{
 const p=cleanProgress({version:1,answers:{good:{value:'Hello',correct:true},bad:{correct:'yes'}},saved:['word','word',null],lastUnit:'unit-3'});
 assert.equal(p.answers.good.correct,true);assert.equal(p.answers.bad,undefined);assert.deepEqual(p.saved,['word']);assert.equal(p.lastUnit,'unit-3');
 assert.equal(Object.keys(cleanProgress({version:99,answers:{test:true}}).answers).length,0);
});
test('all question IDs are unique across their units',()=>{
 const keys=units.flatMap(u=>allQuestions(u).map(q=>q.key));assert.equal(keys.length,new Set(keys).size);
});
test('paths work beneath a GitHub project directory and reject traversal or remote URLs',()=>{
 for(const path of ['unit-6.json','audio/AV-001-2.mp3','audio/'])assert.equal(safeRelativePath(path),true);
 for(const path of ['/audio/a.mp3','../secret','audio/../secret','https://example.com/a.mp3','javascript:alert(1)','\\remote'])assert.equal(safeRelativePath(path),false);
});
test('validator catches missing answers and incorrect choice keys',()=>{
 const u=structuredClone(units[0]);u.exerciseGroups[0].questions[0].answer='not an option';assert.ok(validateUnit(u).length);
 const v=structuredClone(units[0]);v.exerciseGroups[0].questions[0].answer=[];assert.ok(validateUnit(v).length);
});
test('future unit template is valid and needs no app changes',async()=>{
 const u=await read('unit-template.json');assert.deepEqual(validateUnit(u),[]);assert.equal(u.number,6);assert.equal(allQuestions(u).length,2);
});
test('listening worksheets deliberately have no unverified answer keys',()=>{
 for(const u of units)for(const activity of u.audio.activities)assert.equal(activity.answerKey,null);
 assert.equal(units[0].audio.suggestedTrack,'AV-001-2.mp3');assert.equal(units[0].audio.track,null);
});
