const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../collection.js'),'utf8');
function setup(fetch,hostname='jingtaolei.github.io',endpoints=['https://primary.example/event']){
 const timers=new Map(),events={},docEvents={};let now=0,id=0;
 const window={ANONYMOUS_ANALYTICS_ENDPOINTS:endpoints,addEventListener:(name,fn)=>events[name]=fn};
 const navigator={onLine:true};const document={referrer:'https://google.com/search?q=private',visibilityState:'visible',addEventListener:(name,fn)=>docEvents[name]=fn};
 const context={window,document,navigator,location:{hostname,pathname:'/'},URL,AbortController,fetch,Promise,Date:{now:()=>now},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:key=>timers.delete(key)};
 vm.runInNewContext(source,context);return {client:window.AnonymousCollection,timers,events,docEvents,navigator,advance:ms=>now+=ms};
}
const success=()=>Response.json({ok:true,service:'jingtao-anonymous-collector',version:'collector-v3'});
(async()=>{
 const calls=[];let reachable=false;
 const env=setup(async(url,options)=>{calls.push({url:String(url),options});if(String(url).includes('check=1')){if(!reachable)throw Error('offline');return success();}return new Response(null,{status:204});});
 await env.client.send('page_view','page');assert.equal(env.client.getStatus().pending,1);assert.equal(calls.filter(c=>!c.url.includes('check=1')).length,0);assert.equal(env.timers.size,1);
 reachable=true;env.advance(2000);await env.events.online();assert.equal(env.client.getStatus().pending,0);assert.equal(env.client.getStatus().accepted,1);assert.equal(env.timers.size,0);
 const sent=calls.find(c=>!c.url.includes('check=1'));assert.deepEqual(JSON.parse(sent.options.body),{event:'page_view',page:'/',referrer_host:'google.com',context:'page'});assert.equal(sent.options.credentials,'omit');assert.equal(sent.options.keepalive,true);assert.equal(sent.options.redirect,'error');
 let posts=0;const ambiguous=setup(async(url)=>{if(String(url).includes('check=1'))return success();posts++;throw Error('server may have accepted');});await ambiguous.client.send('page_view','page');await ambiguous.events.online();assert.equal(posts,1);assert.equal(ambiguous.client.getStatus().unconfirmed,1);assert.equal(ambiguous.client.getStatus().pending,0);
 const expired=setup(async()=>{throw Error('unreachable');});await expired.client.send('page_view','page');expired.advance(120001);await expired.events.online();assert.equal(expired.client.getStatus().expired,1);assert.equal(expired.client.getStatus().pending,0);
 const fallbackCalls=[];const fallback=setup(async(url)=>{fallbackCalls.push(String(url));if(String(url).startsWith('https://first.example'))throw Error('blocked');return String(url).includes('check=1')?success():new Response(null,{status:204});},'jingtaolei.github.io',['https://first.example/event','https://second.example/event']);const fallbackSending=fallback.client.send('page_view');await Promise.resolve();await [...fallback.timers.values()].find(t=>t.ms===1000).fn();await fallbackSending;assert.equal(fallback.client.getStatus().accepted,1);assert.deepEqual(fallbackCalls,['https://first.example/event?check=1','https://second.example/event?check=1','https://second.example/event']);
 const stalledCalls=[];const stalled=setup(async(url)=>{stalledCalls.push(String(url));if(String(url).startsWith('https://stalled.example'))return new Promise(()=>{});return String(url).includes('check=1')?success():new Response(null,{status:204});},'jingtaolei.github.io',['https://stalled.example/event','https://ready.example/event']);const waiting=stalled.client.send('page_view');await [...stalled.timers.values()].find(t=>t.ms===1000).fn();await waiting;assert.equal(stalled.client.getStatus().accepted,1);assert.equal(stalledCalls.length,3);
 const offline=setup(async()=>{throw Error('must not fetch offline');});offline.navigator.onLine=false;await offline.client.send('page_view');assert.equal(offline.client.getStatus().pending,1);assert.equal(offline.client.getStatus().probeAttempts,0);
 const invalid=setup(async()=>{throw Error('must not fetch');},'localhost');await invalid.client.send('page_view');assert.equal(invalid.client.getStatus().state,'disabled');assert.equal(invalid.client.getStatus().pending,0);
 const impostor=setup(async()=>Response.json({ok:true}));await impostor.client.send('page_view');assert.equal(impostor.client.getStatus().accepted,0);assert.equal(impostor.client.getStatus().pending,1);
 const capped=setup(async()=>{throw Error('must not fetch');});capped.navigator.onLine=false;for(let i=0;i<70;i++)await capped.client.send('view_research');assert.equal(capped.client.getStatus().pending,64);
 console.log('Collection checks passed: startup recovery, ambiguity, expiry, fallback, offline, localhost, protocol, bounded memory.');
})().catch(error=>{console.error(error);process.exitCode=1;});

// The diagnostics must probe POST even when health is blocked.
(async()=>{
 const nodes={};for(const id of ['#run','#copy','#result','#status','#network'])nodes[id]={value:'普通网络，无 VPN',addEventListener(name,fn){this[name]=fn;}};
 const calls=[];vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../connection-check.js'),'utf8'),{document:{querySelector:selector=>nodes[selector]||{content:'local-release'}},window:{ANONYMOUS_ANALYTICS_ENDPOINTS:['https://primary.example/event']},location:{hostname:'jingtaolei.github.io'},URL,AbortController,performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},Date,fetch:async(url)=>{calls.push(String(url));return String(url).includes('/health')?new Response('blocked',{status:503}):Response.json({ok:true,service:'jingtao-anonymous-collector',country:'CN',version:'collector-v3'});},navigator:{}});
 await nodes['#run'].click();const report=JSON.parse(nodes['#result'].textContent);assert.equal(report.checks[0].health.success,false);assert.equal(report.checks[0].post.success,true);assert.equal(report.checks[0].success,true);assert.equal(calls.length,2);assert.equal(report.checks[0].post.country,'CN');console.log('Diagnostic independence check passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
