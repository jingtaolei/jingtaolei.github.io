// Short-lived delivery state only. No cookies, browser storage, visitor IDs or replay IDs.
(()=>{
 const endpoints=[...new Set((window.ANONYMOUS_ANALYTICS_ENDPOINTS||[]).filter(value=>{
  try{const u=new URL(value);return u.protocol==='https:'&&u.pathname==='/event'&&!u.username&&!u.password&&!u.search&&!u.hash;}catch{return false;}
 }))];
 const enabled=!['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&endpoints.length>0;
 const lifetime=120000,maxPending=64,delays=[2000,5000,15000,30000];
 const allowed=new Set(['page_view','view_research','view_publications','view_skills','view_awards','view_contact','click_cv','click_github_profile','click_project_code','click_publications_nav','click_academic_email','click_personal_email']);
 let pending=[],selected=null,running=false,retryTimer=null,retries=0;
 const status={accepted:0,unconfirmed:0,expired:0,probeAttempts:0,state:enabled?'idle':'disabled'};
 const options={method:'POST',mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',headers:{'Content-Type':'text/plain;charset=UTF-8'}};
 const body=(event,context)=>JSON.stringify({event,page:location.pathname||'/',referrer_host:(()=>{try{return document.referrer?new URL(document.referrer).hostname:'direct';}catch{return 'unknown';}})(),context});
 function prune(){const now=Date.now();const next=pending.filter(item=>now-item.queuedAt<lifetime);status.expired+=pending.length-next.length;pending=next;}
 async function choose(){
  for(const endpoint of endpoints){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);status.probeAttempts++;
   try{
    const url=new URL(endpoint);url.searchParams.set('check','1');
    const response=await fetch(url,{...options,signal:controller.signal,body:JSON.stringify({event:'page_view',page:'/',context:'connection-check'})});
    if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))continue;
    const result=await response.json();
    if(result.ok&&(result.service==='jingtao-anonymous-collector'||result.version==='observatory-v2'))return endpoint;
   }catch{}finally{clearTimeout(timer);}
  }
  return null;
 }
 function later(){
  prune();if(!pending.length||retryTimer||navigator.onLine===false)return;
  retryTimer=setTimeout(()=>{retryTimer=null;pump();},delays[Math.min(retries++,delays.length-1)]);
 }
 async function transmit(item,endpoint){
  // Once POST has started, an ambiguous failure must not be replayed on another
  // host: the server might already have written it. Only unsent items are queued.
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(endpoint,{...options,keepalive:true,signal:controller.signal,body:item.body});
   if(response.status===204){status.accepted++;return true;}
  }catch{}finally{clearTimeout(timer);}
  status.unconfirmed++;return false;
 }
 async function pump(){
  if(!enabled||running||retryTimer)return;
  prune();if(!pending.length)return;
  if(navigator.onLine===false){status.state='offline';return;}
  running=true;
  try{
   while(pending.length){
    prune();if(!pending.length)break;
    if(!selected){status.state='checking';selected=await choose();}
    if(!selected){status.state='waiting';later();break;}
    // A probe can take time; expire stale events before sending, too.
    prune();if(!pending.length)break;
    const item=pending.shift();status.state='sending';
    if(!await transmit(item,selected))selected=null;else retries=0;
   }
   if(!pending.length)status.state='idle';
  }finally{running=false;}
 }
 function send(event,context='site'){
  if(!enabled||!allowed.has(event))return Promise.resolve();
  prune();if(pending.length>=maxPending){status.expired++;return Promise.resolve();}
  pending.push({body:body(event,String(context).slice(0,64)),queuedAt:Date.now()});return pump();
 }
 function resume(){if(retryTimer){clearTimeout(retryTimer);retryTimer=null;}return pump();}
 window.addEventListener('online',resume);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resume();});
 // A previously verified endpoint can receive remaining unsent items on exit.
 // A failed initial probe never triggers an unchecked request during navigation.
 window.addEventListener('pagehide',()=>{
  if(!selected||!pending.length)return;prune();
  for(const item of pending.splice(0))transmit(item,selected);
 });
 window.AnonymousCollection={send,getStatus:()=>({...status,pending:pending.filter(item=>Date.now()-item.queuedAt<lifetime).length})};
})();
