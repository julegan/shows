'use strict';
(async()=>{
const urls=[
['twilight','https://www.twilightcafeandbar.com/calendar/'],
['twilight-detail','https://www.twilightcafeandbar.com/event/466625/Lioneer-w-Gavin-Prophet-Drifter-Nervous-State'],
['star','https://www.startheaterportland.com/event/'],
['soundcontrol','https://www.soundcontrolpdx.com/']
];
for(const [id,url] of urls){try{
const res=await fetch(url,{signal:AbortSignal.timeout(17000)});const html=await res.text();
const targets=id==='twilight'?['event_466625','fc-calendar-container','2026-10-20','custom-month','cal-events','event_data','eventCalendar','events =','2026-10','"2026','var events']:id==='twilight-detail'?['<h1','event-date','event-time','Doors:','Tuesday','Oct 20','2026','<title','event_name']:id==='star'?['tw-plugin-upcoming-event-list','tw-section','tw-event-date','CHURCH OF HIVE']:['append-refer','event-date','event-header','THE WELL'];
for(const target of targets){const at=html.indexOf(target);if(at>=0)console.log('SECTION '+JSON.stringify({id,needle:target,at,markup:html.slice(Math.max(0,at-550),at+1250).replace(/\s+/g,' ').slice(0,1750)}));}
console.log('COMPONENT '+JSON.stringify({id,status:res.status,htmlBytes:html.length,eventModals:(html.match(/class="modal hide fade event_modal"/g)||[]).length,starDates:(html.match(/tw-event-date-complete/g)||[]).length,soundCards:(html.match(/class="append-refer"/g)||[]).length}));
}catch(e){console.log('FAILED '+id+' '+String(e))}}
})();