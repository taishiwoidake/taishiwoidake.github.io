"use strict";
(() => {
  document.body.classList.add("has-js");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const panels = Array.from(document.querySelectorAll("section.panel"));
  const navLinks = Array.from(document.querySelectorAll(".nav a"));
  const label = document.getElementById("scene-number");
  const progress = document.getElementById("progress-bar");
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
  const names = {
    home: "01 / 05   —   THE COSMOS",
    garden: "02 / 05   —   THE GARDEN",
    research: "03 / 05   —   THE QUESTIONS",
    work: "04 / 05   —   THE WORK",
    contact: "05 / 05   —   THE HORIZON"
  };

  function setScene(id) {
    document.body.dataset.scene = id;
    if (label) label.textContent = names[id] || names.home;
    navLinks.forEach(link => {
      if (link.getAttribute("href") === "#" + id) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window) {
    const panelObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      setScene(visible[0].target.dataset.scene);
    }, { rootMargin: "-28% 0px -28% 0px", threshold: [0, .1, .2, .4, .6] });
    panels.forEach(panel => panelObserver.observe(panel));

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    window.addEventListener("scroll", () => {
      let selected = panels[0];
      for (const panel of panels) {
        if (panel.getBoundingClientRect().top < window.innerHeight * .6) selected = panel;
      }
      setScene(selected.dataset.scene);
    }, { passive: true });
  }

  let scrollY = window.scrollY;
  let ticking = false;
  function onScroll() {
    scrollY = window.scrollY;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (progress) progress.style.transform = "scaleX(" + Math.min(1, scrollY / max) + ")";
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  const garden = document.getElementById("garden-visual");
  if (garden && !reducedMotion) {
    for (let i = 0; i < 15; i++) {
      const petal = document.createElement("i");
      petal.className = "petal-drift";
      petal.setAttribute("aria-hidden", "true");
      petal.style.setProperty("--x", (7 + Math.random() * 86).toFixed(2) + "%");
      petal.style.setProperty("--size", (4 + Math.random() * 7).toFixed(1) + "px");
      petal.style.setProperty("--rot", (Math.random() * 360).toFixed(1) + "deg");
      petal.style.setProperty("--duration", (10 + Math.random() * 12).toFixed(1) + "s");
      petal.style.setProperty("--delay", (-Math.random() * 19).toFixed(1) + "s");
      petal.style.setProperty("--drift", ((Math.random() - .5) * 220).toFixed(0) + "px");
      garden.appendChild(petal);
    }
  }

  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  let width = 0, height = 0, stars = [];
  const pointer = { x: 0, y: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const amount = width < 650 ? 85 : 175;
    stars = Array.from({ length: amount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.15 + .25,
      opacity: Math.random() * .48 + .18,
      depth: Math.random() * .8 + .2,
      phase: Math.random() * Math.PI * 2
    }));
    draw(0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    const breath = reducedMotion ? 0 : t * .00055;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const dy = (scrollY * s.depth * .075) % height;
      const y = (s.y - dy + height) % height;
      const x = s.x + pointer.x * s.depth * 6;
      const alpha = Math.max(.06, Math.min(.9, s.opacity + Math.sin(breath + s.phase) * .12));
      ctx.fillStyle = "rgba(211,237,242," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reducedMotion) requestAnimationFrame(draw);
  }

  if (!reducedMotion) {
    window.addEventListener("pointermove", event => {
      pointer.x = (event.clientX / Math.max(width, 1) - .5) * 2;
      pointer.y = (event.clientY / Math.max(height, 1) - .5) * 2;
    }, { passive: true });
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();
  if (!reducedMotion) requestAnimationFrame(draw);
})();
