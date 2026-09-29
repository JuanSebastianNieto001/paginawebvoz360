// Se carga en el <head> (sin defer): la página siempre empieza desde el inicio
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
window.scrollTo(0, 0);
window.addEventListener("pageshow", function () { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); });
document.documentElement.classList.add('js', 'intro-active');
setTimeout(function () { var i = document.getElementById('intro'); if (i) i.classList.add('is-done'); document.documentElement.classList.remove('intro-active'); }, 8000);
