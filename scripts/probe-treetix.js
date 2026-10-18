"use strict";
(async()=>{
for(const url of ["https://www.treetix.com/event?id=204790&cal=soundcontrol","https://www.treetix.com/event?id=204931&cal=soundcontrol"]){
 try{
 const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{"Accept":"text/html","User-Agent":"SHOWS-source-review/0.1"}});
 const h=(await r.text()).slice(0,600000);
 const needles=["<title","event-date","DOORS","7:00","8:00","datetime","2026","the well","startDate","Event","SHOWTIME","time","DATE"];
 const arr=[];
 for(const n of needles){const i=h.toLowerCase().indexOf(n.toLowerCase());if(i>=0)arr.push({key:n,excerpt:h.slice(Math.max(0,i-240),i+350).replace(/\s+/g," ").slice(0,580)})}
 console.log("TICKET "+JSON.stringify({url,status:r.status,length:h.length,preview:h.slice(0,300).replace(/\s+/g," "),samples:arr}));
 }catch(e){console.log("TICKET_ERROR "+String(e))}
}
})();