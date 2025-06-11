function getCookie(name){
  const m=document.cookie.match('(^|;)\\s*'+name+'=([^;]+)');
  return m?m.pop():'';
}
function setTheme(t){
  document.documentElement.setAttribute('data-bs-theme',t);
  document.cookie='theme='+t+';path=/';
}
function initThemeToggle(){
  const saved=getCookie('theme')||'light';
  setTheme(saved);
  const icon=document.getElementById('theme-icon');
  if(!icon) return;
  icon.classList.toggle('fa-sun',saved==='dark');
  icon.classList.toggle('fa-moon',saved!=='dark');
  document.getElementById('theme-toggle').addEventListener('click',()=>{
    const cur=document.documentElement.getAttribute('data-bs-theme');
    const next=cur==='dark'?'light':'dark';
    setTheme(next);
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');
    if(typeof window.onThemeChange==='function') window.onThemeChange(next);
  });
}
document.addEventListener('DOMContentLoaded',initThemeToggle);
