const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../web/js/task-contract.js');
const style={id:'V6',title:'形变',path:'风格提示词/V_mg-styles-15/V6_形变.md',sha256:'a'.repeat(64)};
test('one brief defaults to an authorized complete film and automatic primary role',()=>{
  const t=c.createTask({content:'解释机器人如何核验任务'},[style],{});
  assert.equal(t.phase,'final'); assert.equal(t.brief,'解释机器人如何核验任务');
  assert.equal(t.duration_seconds,20); assert.equal(t.width,1920); assert.equal(t.height,1080);
  assert.equal(t.style_roles.V6,'main'); assert.equal(t.audio.mode,'ambient');
  assert.equal(t.authorization.final_render,true);
  const p=c.prompt(t);
  assert.ok(p.startsWith('/fy-code-animation')); assert.ok(p.includes('.dsh/skills/fy-code-animation/SKILL.md'));
  assert.ok(p.includes(style.sha256)); assert.ok(p.includes('不要再等作者确认'));
  assert.ok(!p.includes('四案')); assert.ok(p.length<2000);
});
test('portrait dimensions and explicit card boundary are preserved',()=>{
  const t=c.createTask({content:'测试',ratio:'9:16',resolution:'1920x1080',phase:'card'},[style],{});
  assert.equal(t.width,1080); assert.equal(t.height,1920);
  assert.equal(t.authorization.final_render,false);
  assert.ok(!c.prompt(t).includes('已授权直接完成'));
});
test('copy-only prompt contains the complete task JSON for DSH without ZIP',()=>{
  const t=c.createTask({content:'创意',resolution:'1280x720'},[style],{});
  assert.equal(t.width,1280);
  const embedded=JSON.parse(c.prompt(t).split('```json\n')[1].split('\n```')[0]);
  assert.deepEqual(embedded,t);
});
test('empty content, absent styles and corrupt style metadata fail actionably',()=>{
  assert.throws(()=>c.createTask({content:''},[style],{}),/想法/);
  assert.throws(()=>c.createTask({content:'测试'},[],{}),/风格/);
  assert.throws(()=>c.createTask({content:'测试'},[{...style,missingPrompt:true}],{}),/原文/);
  assert.throws(()=>c.createTask({content:'测试',duration:0},[style],{}),/时长/);
});
