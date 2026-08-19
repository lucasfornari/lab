/* ===========================================================
   TEMA (claro/escuro)
   =========================================================== */
function initTheme(){
  const saved = localStorage.getItem('genshinPlannerTheme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.classList.toggle('dark', useDark);
}
initTheme();
document.getElementById('themeToggle').addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('genshinPlannerTheme', isDark ? 'dark' : 'light');
});
