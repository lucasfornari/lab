/* ===========================================================
   DETECÇÃO DE DEVICE (layout mobile x desktop)
   =========================================================== */
const MOBILE_LAYOUT_CLASSES = ['px-3', 'py-5'];
const DESKTOP_LAYOUT_CLASSES = ['px-6', 'py-8', 'lg:px-10', 'xl:px-12'];

function detectDeviceType() {
  const smallViewport = window.matchMedia('(max-width: 767px)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const touchDevice = navigator.maxTouchPoints > 0;
  return (smallViewport || (coarsePointer && touchDevice)) ? 'mobile' : 'desktop';
}

function applyDeviceLayout() {
  if (!els.appShell) return;
  const device = detectDeviceType();
  document.body.dataset.device = device;
  els.appShell.classList.remove(...MOBILE_LAYOUT_CLASSES, ...DESKTOP_LAYOUT_CLASSES);
  els.appShell.classList.add(...(device === 'mobile' ? MOBILE_LAYOUT_CLASSES : DESKTOP_LAYOUT_CLASSES));
}

window.addEventListener('resize', applyDeviceLayout);
window.addEventListener('orientationchange', applyDeviceLayout);
