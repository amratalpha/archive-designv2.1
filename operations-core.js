(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ArchiveOps=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ASOF='2026-10-28',NOW=ASOF+'T12:00:00Z';
const departments=['Information Technology','Finance','Human Resources','Procurement','Support Services','Legal','Investments'];
const users=['Abeer Ahmed','Khalid Al Mazrouei','Sara Hassan','Omar Ali','Mariam Saeed'];
const series=[{code:'IT-04',name:'Information security',ar:'أمن المعلومات'},{code:'FN-02',name:'Financial reporting',ar:'التقارير المالية'},{code:'HR-03',name:'Employee services',ar:'خدمات الموظفين'},{code:'PR-01',name:'Procurement contracts',ar:'عقود المشتريات'},{code:'SS-05',name:'Administrative correspondence',ar:'المراسلات الإدارية'}];
const day=s=>new Date(s.slice(0,10)+'T00:00:00Z');
const iso=d=>d.toISOString().slice(0,10);
const add=(s,n)=>{const d=day(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)};
const days=(a,b)=>Math.round((day(b)-day(a))/86400000);
function seed(){const records=[];for(let i=0;i<632;i++){
 const recent=i<412,old=i>=412&&i<532,archived=recent||old;
 const completed=recent?add(ASOF,-(i%30)):old?add(ASOF,-(45+(i-412)*4)):'';
 const created=archived?add(completed,-(2+i%12)):add(ASOF,-(1+(i-532)%21));
 const pending=i>=532&&i<539,dropoff=i>=539&&i<542;
 const kind=['Policy','Contract','Correspondence','Report','Decision'][i%5],s=series[i%5];
 let lifecycle=i<51?'review_due':i<58?'transfer_due':i<63?'legal_hold':i<67?'authorized_disposition':'active';
 const lifecycleDue=i<58?add(ASOF, i%7===0?-3:1+i%85):'';
 const due=pending?(i<534?add(ASOF,-(i-531)):add(ASOF,i-533)) : add(created,10);
 const r={id:'DAS-'+String(260001+i),title:kind+' · '+s.name+' · '+String(i+1).padStart(3,'0'),titleAr:['سياسة','عقد','مراسلة','تقرير','قرار'][i%5]+' · '+s.ar+' · '+(i+1),department:departments[i%7],type:kind,series:s.code,createdAt:created,documentDate:i===540||i===541?'':created,completedAt:completed,processedBy:users[i%5],archiveStatus:archived?'archived':dropoff?'dropoff':'processing',workflowStatus:archived?'Completed':pending?(i%2?'Awaiting approval':'Metadata review'):dropoff?'Awaiting indexing':'In progress',requiredAction:pending?(i%2?'Review and approve':'Validate metadata'):'Review record',priority:pending?(i<534?'High':i<537?'Medium':'Normal'):'Normal',dueAt:due+'T17:00:00Z',confidence:i===539?62:91+i%9,quality:i===539?'low_confidence':i===540||i===541?'missing_metadata':'confirmed',proposedSeries:s.code,lifecycle,lifecycleDue,retentionException:i===2||i===9||i===16,pending,legalHold:lifecycle==='legal_hold',authorizationId:lifecycle==='authorized_disposition'?'DA-2026-042':'',sensitivity:i%6===0?'Confidential':'Sensitive',events:[{date:created,action:'Received',by:'Capture service'}]};
 if(completed)r.events.push({date:completed,action:'Archived',by:r.processedBy});records.push(r)}return records}
function match(r,f={}){
 if(f.q&&!([r.id,r.title,r.titleAr,r.department,r.series].join(' ').toLowerCase().includes(f.q.toLowerCase())))return false;
 for(const k of ['department','series','type','archiveStatus','lifecycle','processedBy','workflowStatus'])if(f[k]&&r[k]!==f[k])return false;
 if(f.from&&r.documentDate<f.from)return false;if(f.to&&r.documentDate>f.to)return false;
 if(f.scope==='attention'&&!(r.pending||r.quality!=='confirmed'||r.retentionException))return false;
 if(f.scope==='pending'&&!r.pending)return false;
 if(f.scope==='overdue'&&!(r.pending&&r.dueAt<NOW))return false;
 if(f.scope==='dropoff'&&r.archiveStatus!=='dropoff')return false;
 if(f.scope==='recent'&&!(r.archiveStatus==='archived'&&r.completedAt>=add(ASOF,-29)&&r.completedAt<=ASOF))return false;
 if(f.scope==='retention'&&!['review_due','transfer_due'].includes(r.lifecycle))return false;
 if(f.scope==='exceptions'&&!r.retentionException)return false;
 if(f.scope==='quality'&&r.quality==='confirmed')return false;
 if(f.scope==='low_confidence'&&r.quality!=='low_confidence')return false;
 return true;
}
function filter(records,f){return records.filter(r=>match(r,f))}
function kpis(records){const count=scope=>filter(records,{scope}).length;return {pending:count('pending'),overdue:count('overdue'),dropoff:count('dropoff'),recent:count('recent'),retention:count('retention'),exceptions:count('exceptions'),lowConfidence:count('low_confidence'),quality:count('quality'),review:filter(records,{lifecycle:'review_due'}).length,transfer:filter(records,{lifecycle:'transfer_due'}).length,holds:filter(records,{lifecycle:'legal_hold'}).length,disposition:filter(records,{lifecycle:'authorized_disposition'}).length}}
function period(mode,from,to){const y=Number(ASOF.slice(0,4)),m=Number(ASOF.slice(5,7));let start=ASOF,end=ASOF;
 if(mode==='weekly'){let offset=(day(ASOF).getUTCDay()+6)%7;start=add(ASOF,-offset)}
 if(mode==='monthly')start=ASOF.slice(0,7)+'-01';
 if(mode==='quarterly')start=y+'-'+String(Math.floor((m-1)/3)*3+1).padStart(2,'0')+'-01';
 if(mode==='semiannual')start=y+'-'+(m<=6?'01':'07')+'-01';
 if(mode==='annual')start=y+'-01-01';
 if(mode==='custom'){if(!from||!to||from>to||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))throw Error('Choose a valid date range.');start=from;end=to;if(end>ASOF)throw Error('The demo has data only up to '+ASOF+'.');if(days(start,end)>1095)throw Error('Choose a range of three years or less.');}
 const span=days(start,end)+1;return {from:start,to:end,previousFrom:add(start,-span),previousTo:add(start,-1),span}}
function summarize(records,from,to){const end=to+'T23:59:59Z';const received=records.filter(r=>r.createdAt>=from&&r.createdAt<=to);const completed=records.filter(r=>r.completedAt&&r.completedAt>=from&&r.completedAt<=to);const backlog=records.filter(r=>r.createdAt<=to&&(!r.completedAt||r.completedAt>to));const overdue=backlog.filter(r=>r.dueAt<end);const onTime=completed.filter(r=>r.completedAt+'T12:00:00Z'<=r.dueAt);return {received:received.length,completed:completed.length,backlog:backlog.length,overdue:overdue.length,pending:backlog.filter(r=>r.pending).length,sla:completed.length?Math.round(onTime.length/completed.length*100):null,review:records.filter(r=>r.lifecycle==='review_due'&&r.lifecycleDue<=to).length,transfer:records.filter(r=>r.lifecycle==='transfer_due'&&r.lifecycleDue<=to).length,holds:records.filter(r=>r.legalHold).length,disposition:records.filter(r=>r.lifecycle==='authorized_disposition').length}}
function report(records,p,dept='',user=''){const source=records.filter(r=>(!dept||r.department===dept)&&(!user||r.processedBy===user));const current=summarize(source,p.from,p.to),previous=summarize(source,p.previousFrom,p.previousTo);const departmentsOut=departments.filter(d=>!dept||dept===d).map(d=>({name:d,...summarize(source.filter(r=>r.department===d),p.from,p.to)}));const userRows=users.filter(u=>!user||user===u).map(u=>({name:u,...summarize(source.filter(r=>r.processedBy===u),p.from,p.to)}));const bins=Math.min(12,p.span),width=Math.ceil(p.span/bins),trend=[];for(let d=p.from;d<=p.to;d=add(d,width)){const end=add(d,width-1)>p.to?p.to:add(d,width-1);trend.push({from:d,to:end,...summarize(source,d,end)})}return {current,previous,departments:departmentsOut,users:userRows,trend,source}}
function reportRecords(records,p,kind,dept='',user=''){return records.filter(r=>(!dept||r.department===dept)&&(!user||r.processedBy===user)).filter(r=>kind==='completed'?r.completedAt&&r.completedAt>=p.from&&r.completedAt<=p.to:kind==='received'?r.createdAt>=p.from&&r.createdAt<=p.to:kind==='overdue'?r.createdAt<=p.to&&(!r.completedAt||r.completedAt>p.to)&&r.dueAt<p.to+'T23:59:59Z':kind==='pending'?r.pending&&r.createdAt<=p.to&&(!r.completedAt||r.completedAt>p.to):r.createdAt<=p.to&&(!r.completedAt||r.completedAt>p.to))}
function apply(records,id,action,values={}){const r=records.find(x=>x.id===id);if(!r)throw Error('Record not found');const beforeSeries=r.series;
 if(action==='classify'){if(!values.title?.trim()||!values.department||!values.series||!series.some(s=>s.code===values.series)||!departments.includes(values.department))throw Error('Title, department and a valid record series are required.');const documentDate=values.documentDate??r.documentDate,type=values.type??r.type;if(!documentDate||!/^\d{4}-\d{2}-\d{2}$/.test(documentDate)||documentDate>ASOF||!['Policy','Contract','Correspondence','Report','Decision'].includes(type))throw Error('A valid document date and document type are required.');Object.assign(r,{title:values.title.trim(),titleAr:values.titleAr?.trim()||r.titleAr,department:values.department,series:values.series,quality:'confirmed',reviewedBy:users[0],reviewedAt:ASOF,documentDate,type,workflowStatus:'Ready to declare'});}
 else if(action==='complete_task'){if(!r.pending)throw Error('This task is no longer pending.');r.pending=false;r.archiveStatus='archived';r.workflowStatus='Completed';r.completedAt=ASOF;r.processedBy=users[0];}
 else if(action==='retention_review'){if(r.legalHold)throw Error('A legal hold prevents lifecycle progression.');if(r.lifecycle!=='review_due')throw Error('This record is not awaiting retention review.');if(r.retentionException)throw Error('Resolve the retention exception before completing review.');r.lifecycle='active';r.lifecycleDue='';}
 else if(action==='prepare_transfer'){if(r.legalHold||r.lifecycle!=='transfer_due'||r.workflowStatus==='Transfer package prepared')throw Error('This record is not eligible for transfer.');r.workflowStatus='Transfer package prepared';}
 else if(action==='resolve_exception'){if(!values.note?.trim())throw Error('A resolution note is required.');r.retentionException=false;}
 else throw Error('Unsupported action');r.events.push({date:ASOF,action,by:users[0],note:values.note||(action==='classify'?'Classification reviewed: '+beforeSeries+' → '+r.series+'; metadata validated':'')});return r}
return {ASOF,NOW,departments,users,series,add,days,seed,match,filter,kpis,period,summarize,report,reportRecords,apply};
});
