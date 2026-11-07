const {chromium}=require('playwright');const {spawn}=require('child_process');
const D=process.argv[2], mode=process.argv[3]||'stills';
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('http://127.0.0.1:8765/stage.html',{waitUntil:'networkidle'});
 await p.evaluate(()=>document.fonts.ready);
 console.log(JSON.stringify(await p.evaluate(()=>window.prepare())), await p.evaluate(()=>TOTAL));
 const T=await p.evaluate(()=>TOTAL);
 if(mode==='stills'){
   for(const t of [2.5,6,10.5,14,22,27,31,T-1]){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${D}/still_${t.toFixed(1)}.jpg`,type:'jpeg',quality:70});}
 } else {
   const fps=30,N=Math.ceil(T*fps);
   const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',''+fps,'-i','-','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',`${D}/out.mp4`],{stdio:['pipe','inherit','inherit']});
   for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:95});
     if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); if(i%150==0)console.log('frame',i,'/',N);}
   ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();
})();
