// Pure helpers shared by the app and the dependency-free test suite.
export function normalise(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[‘’]/g, "'").replace(/[‐‑–—]/g, '-').replace(/\s+/g, ' ')
    .trim().replace(/[.!?]+$/, '').trim();
}
export function accepts(question, value) {
  const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
  return answers.some(answer => normalise(answer) === normalise(value));
}
export function questionKey(unit, group, question) { return `${unit}:${group}:${question}`; }
export function allQuestions(unit) {
  return unit.exerciseGroups.flatMap(group => group.questions.map(question => ({group, question, key:questionKey(unit.id, group.id, question.id)})));
}
export function unitStats(unit, answers) {
  const qs = allQuestions(unit);
  const attempted = qs.filter(q => answers[q.key]).length;
  const correct = qs.filter(q => answers[q.key]?.correct === true).length;
  return { total:qs.length, attempted, correct, percent:qs.length ? Math.round(correct/qs.length*100) : 0 };
}
export function safeRelativePath(path) {
  return typeof path === 'string' && path.length > 0 && !/^(?:[a-z]+:|\/|\\)/i.test(path) && !path.split(/[\\/]/).includes('..');
}
export function validateUnit(unit) {
  const issues=[];
  if (!unit || unit.schemaVersion !== 1) return ['schemaVersion must be 1'];
  if (!/^[a-z0-9-]+$/.test(unit.id || '')) issues.push('id must contain lowercase letters, numbers or hyphens');
  if (!Number.isInteger(unit.number) || unit.number < 1) issues.push('number must be a positive integer');
  for (const field of ['title','shortTitle','description']) if(typeof unit[field] !== 'string' || !unit[field].trim()) issues.push(`${field} must be text`);
  for (const field of ['objectives','lessons','vocabulary','exerciseGroups']) if(!Array.isArray(unit[field]) || !unit[field].length) issues.push(`${field} must be a non-empty array`);
  const groupIds=new Set();
  for(const g of unit.exerciseGroups || []) {
    if(!g.id || groupIds.has(g.id)) issues.push('Exercise group IDs must be unique');
    groupIds.add(g.id);
    if(!g.title || !g.instruction || !Array.isArray(g.questions) || !g.questions.length) { issues.push(`Incomplete exercise group: ${g.id}`); continue; }
    const ids=new Set();
    for(const q of g.questions) {
      if(!q.id || ids.has(q.id)) issues.push(`Question IDs must be unique in ${g.id}`); ids.add(q.id);
      if(!q.prompt || !q.explanation) issues.push(`Missing prompt/explanation: ${q.id}`);
      const answers=Array.isArray(q.answer)?q.answer:[q.answer];
      if(!answers.length || answers.some(a=>typeof a!=='string'||!a.trim())) issues.push(`Missing answer: ${q.id}`);
      if(!['choice','text'].includes(q.type)) issues.push(`Unknown question type: ${q.id}`);
      if(q.type==='choice' && (!Array.isArray(q.options)||q.options.length<2||new Set(q.options).size!==q.options.length||!answers.every(a=>q.options.includes(a)))) issues.push(`Invalid options: ${q.id}`);
    }
  }
  for(const v of unit.vocabulary || []) if(!v.term || !v.definition || !v.example) issues.push('Incomplete vocabulary entry');
  for(const l of unit.lessons || []) if(!l.title || !l.body || !Array.isArray(l.examples)) issues.push('Incomplete lesson');
  if(unit.audio?.track && !safeRelativePath(unit.audio.track)) issues.push('Audio track must be a relative path');
  for(const a of unit.audio?.activities || []) {
    if(!a.id || !a.title || !Array.isArray(a.options) || !Number.isInteger(a.extracts) || a.extracts<1) issues.push('Invalid listening activity');
    if(a.answerKey!==null && a.answerKey!==undefined && (!Array.isArray(a.answerKey)||a.answerKey.length!==a.extracts||!a.answerKey.every(x=>a.options.includes(x)))) issues.push(`Invalid listening answer key: ${a.id}`);
  }
  return issues;
}
export function cleanProgress(raw) {
  const result={version:1, answers:{}, saved:[], lessons:{}, listening:{}, tracks:{}, lastUnit:null};
  if(!raw || typeof raw!=='object' || raw.version!==1) return result;
  if(raw.answers && typeof raw.answers==='object') for(const [key,a] of Object.entries(raw.answers)) {
    if(a && typeof a.correct==='boolean' && typeof a.value==='string') result.answers[key]={value:a.value.slice(0,1000),correct:a.correct,date:typeof a.date==='string'?a.date:''};
  }
  result.saved=Array.isArray(raw.saved)?[...new Set(raw.saved.filter(x=>typeof x==='string'))]:[];
  for(const field of ['lessons','listening','tracks']) if(raw[field] && typeof raw[field]==='object' && !Array.isArray(raw[field])) result[field]=raw[field];
  result.lastUnit=typeof raw.lastUnit==='string'?raw.lastUnit:null;
  return result;
}
