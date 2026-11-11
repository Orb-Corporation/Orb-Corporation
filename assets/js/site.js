const navItems = [
  ["/", "Home"],
  ["/about/", "About"],
  ["/products/", "Products"],
  ["/roadmap/", "Roadmap"],
  ["/docs/", "Docs"],
  ["/open-source/", "Open source"]
];

const path = location.pathname.replace(/index\.html$/, "");
const header = document.querySelector("[data-site-header]");

if (header) {
  const navHtml = navItems.map(function (item) {
    const url = item[0];
    const label = item[1];
    const active = path === url || (url !== "/" && path.indexOf(url) === 0);
    return '<a href="' + url + '"' + (active ? ' class="active" aria-current="page"' : "") + ">" + label + "</a>";
  }).join("");

  header.innerHTML =
    '<header class="site-header"><div class="container nav-wrap">' +
      '<a class="brand" href="/" aria-label="Orb Corporation home">' +
        '<img class="brand-logo" src="/Orb%20Corporation%20Orbital%20Logo-3.png" alt="Orb Corporation" width="330" height="82">' +
      '</a>' +
      '<button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="main-navigation">' +
        '<span></span><span></span>' +
      '</button>' +
      '<nav class="main-nav" id="main-navigation" aria-label="Main navigation">' +
        navHtml +
        '<a class="nav-contact' + (path.indexOf("/contact/") === 0 ? " active" : "") + '" href="/contact/"' + (path.indexOf("/contact/") === 0 ? ' aria-current="page"' : "") + '>Contact <span>↗</span></a>' +
      '</nav>' +
    '</div></header>';

  const toggle = header.querySelector(".menu-toggle");
  const nav = header.querySelector(".main-nav");

  function setMenuOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", function () {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) setMenuOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenuOpen(false);
  });
}

const footer = document.querySelector("[data-site-footer]");
if (footer) {
  footer.innerHTML =
    '<footer class="site-footer"><div class="container footer-main">' +
      '<div><a class="brand footer-brand" href="/" aria-label="Orb Corporation home">' +
        '<img class="brand-logo" src="/Orb%20Corporation%20Orbital%20Logo-3.png" alt="Orb Corporation" width="310" height="76">' +
      '</a><p>Free the Internet.</p></div>' +
      '<div class="footer-links">' +
        '<a href="/about/">About</a><a href="/products/">Products</a><a href="/roadmap/">Roadmap</a>' +
        '<a href="/docs/">Docs</a><a href="/updates/">Updates</a><a href="/open-source/">Open source</a>' +
        '<a href="/contribute/">Contribute</a><a href="/contact/">Contact</a><a href="/legal/">Privacy & legal</a>' +
        '<a href="mailto:orbcorporation@proton.me">Email ↗</a>' +
        '<a href="https://github.com/YunaBugendai" target="_blank" rel="noopener">GitHub ↗</a>' +
      '</div>' +
    '</div><div class="container footer-bottom"><span>© ' + new Date().getFullYear() + ' Orb Corporation</span><span>Independent technology venture</span></div></footer>';
}
