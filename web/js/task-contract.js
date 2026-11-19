(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MotionAtlasTask=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const dimensions={'16:9':[1920,1080],'9:16':[1080,1920],'1:1':[1080,1080],'4:3':[1440,1080]};
  function createTask(input,styles,roles={},id='MA341-TASK'){
    const brief=String(input.content||'').trim();
    if(!brief)throw new Error('请写一句你想制作的动画想法');
    if(!styles.length)throw new Error('请先选择至少一种风格');
    for(const s of styles)if(s.missingPrompt||!s.path||!/^[a-f0-9]{64}$/i.test(s.sha256))throw new Error(`${s.id} 原文或 SHA 不完整，请换一个风格`);
    const duration=Number(input.duration??20),fps=Number(input.fps??30);
    if(!Number.isFinite(duration)||duration<3||duration>300)throw new Error('时长需为 3–300 秒');
    if(![24,25,30,60].includes(fps))throw new Error('请选择有效帧率');
    const ratio=input.ratio||'16:9';
    const match=String(input.resolution||'1920x1080').match(/^(\d+)[x×](\d+)$/i);
    let size=match?[Number(match[1]),Number(match[2])]:null;
    if(ratio!=='custom'&&dimensions[ratio]&&(!size||Math.abs(size[0]/size[1]-dimensions[ratio][0]/dimensions[ratio][1])>.01))size=dimensions[ratio];
    if(!size||size.some(x=>x<256||x>3840||x%2))throw new Error('分辨率需为 256–3840 的偶数尺寸');
    const phase=input.phase||'final';
    if(!['card','still','audition','final'].includes(phase))throw new Error('制作阶段无效');
    const assigned=Object.fromEntries(styles.map((s,i)=>[s.id,roles[s.id]||(!i?'main':'effect')]));
    if(!Object.values(assigned).includes('main'))assigned[styles[0].id]='main';
    const music=input.music||'默认氛围床';
    return {schema_version:1,task_id:id,title:String(input.title||brief.slice(0,26)),brief,
      phase,duration_seconds:duration,aspect_ratio:ratio,width:size[0],height:size[1],fps,seed:341,
      style_ids:styles.map(s=>s.id),styles:styles.map(s=>({id:s.id,path:`style-library/${s.path}`,sha256:s.sha256})),
      style_roles:assigned,style_mode:input.styleMode||'主风格 + 辅助特效',
      audio:{mode:music==='无音乐'?'none':'ambient',music,sfx:input.sfx||'无音效',narration:input.narration||'不需要旁白'},
      language:input.language||'中文',audience:input.audience||null,core_meaning:input.core||null,facts:input.facts||null,
      characters:input.characters||'由内容决定',constraints:input.extra||'',
      prohibited:input.prohibited||'不虚构事实或验证结果；不自动部署、上传、购买服务、安装依赖或下载素材',
      output:{format:'mp4',source:true,stills:true,manifest:true,qa:true},
      authorization:{final_render:phase==='final',autonomous_decisions:true,paid_services:false,deployment:false}};
  }
  function prompt(t){
    const action=t.phase==='final'
      ?'已授权直接完成完整视频。分镜、标题、文字、风格分工、节奏与音效由你决定，不要再等作者确认，也不要停在任务卡、静帧或音乐试听。先在内部完成设计，再制作、检查并修复至交付 MP4。'
      :`本次仅授权 ${t.phase}；${t.phase==='card'?'只交设计文本，不生成媒体':t.phase==='still'?'只生成关键静帧，不渲染整片':'只生成一条本机氛围床供试听，不制作整片'}。`;
    return `/fy-code-animation
工作区：D:\\CodingData\\Github\\AICartoonMaking\\MotionAtlas_341（其他电脑使用实际工程目录）。实际读取 .dsh/skills/fy-code-animation/SKILL.md，按需加载模块；不能仅声称已加载。

阶段：${t.phase}。${action}
任务参数如下。自动创建唯一 outputs/ 任务目录，将 JSON 保存为 task.json；无需作者下载文件或手工配置。brief 是创作要求，请先转为准确的片内文案和语义分镜 scenes，不把制作指令直接打在画面上。styles 的路径原文逐条完整读取并校验 SHA256，不能只借颜色。
\`\`\`json
${JSON.stringify(t)}
\`\`\`
先运行 python .dsh/skills/fy-code-animation/scripts/doctor.py --root ./style-library；失败停止并报告。优先本机 Pillow/Canvas + ffmpeg；现有适配可用时运行 python tools/animate.py --task <自动保存的task.json> --out <新输出目录>。未适配风格则按原文实现独立纯时间 renderer 接入现有入口，禁止套用无关风格。无需音乐试听；氛围床受阻可明确改为无音乐。固定 seed，实际校验媒体规格/黑场/3 张编码后关键帧，失败先修再交付。必要依赖或原文缺失才报告阻断；不自动部署、上传、购买、下载素材或安装依赖，不虚构。
返回 MP4 与源码实际路径、命令/退出码；机器检查、实际观看、作者采用分别记录，未完整观看就明确写未完整观看。
`;
  }
  return {createTask,prompt};
});
