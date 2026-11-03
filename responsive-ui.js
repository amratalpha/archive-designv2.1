(()=>{
const storageKey='adpf.appearance';let choice='light';try{choice=localStorage.getItem(storageKey)||'light'}catch{}
const media=window.matchMedia('(prefers-color-scheme: dark)');
function apply(){const dark=choice==='dark'||(choice==='system'&&media.matches);document.documentElement.dataset.appearance=dark?'dark':'light';document.querySelectorAll('[data-appearance-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appearanceChoice===choice)))}
window.addEventListener('adpf:appearance',e=>{choice=e.detail;apply()});apply();if(media.addEventListener)media.addEventListener('change',apply);
document.addEventListener('click',event=>{const theme=event.target.closest('[data-appearance-choice]');if(theme){event.preventDefault();event.stopImmediatePropagation();choice=theme.dataset.appearanceChoice;try{localStorage.setItem(storageKey,choice)}catch{}apply();return}document.querySelectorAll('.account-menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false})},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.account-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus()})});
function enhance(){document.querySelectorAll('.table').forEach(table=>{const labels=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim());table.querySelectorAll('tbody tr').forEach(row=>Array.from(row.cells).forEach((cell,i)=>{if(labels[i])cell.dataset.label=labels[i]}))})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyNew();enhance()})}}).observe(document.body,{childList:true,subtree:true});
function applyNew(){document.querySelectorAll('[data-appearance-choice]').forEach(b=>{const pressed=String(b.dataset.appearanceChoice===choice);if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed)})}
})();
