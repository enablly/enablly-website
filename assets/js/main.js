(() => {
  const THEME_KEY = "enablly-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    applyTheme(initial);

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }
  }

  function initCTAs() {
    const url = window.CTA_URL || "#contact";
    document.querySelectorAll("[data-cta]").forEach((el) => {
      el.setAttribute("href", url);
    });
  }

  function getTooltip() {
    let tip = document.getElementById("stage-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "stage-tooltip";
      tip.className = "stage-tooltip";
      document.body.appendChild(tip);
    }
    return tip;
  }

  function attachStageTooltips(svg) {
    const tip = getTooltip();
    svg.querySelectorAll(".node").forEach((node) => {
      const titleEl = node.querySelector(".stage-title");
      const numEl = node.querySelector(".stage-num");
      const label = [numEl?.textContent?.trim(), titleEl?.textContent?.trim()].filter(Boolean).join(" — ");
      if (!label) return;

      const show = (e) => {
        const rect = node.getBoundingClientRect();
        tip.textContent = label;
        tip.style.left = `${rect.left + rect.width / 2}px`;
        tip.style.top = `${rect.top}px`;
        tip.classList.add("is-visible");
      };
      const hide = () => tip.classList.remove("is-visible");

      node.addEventListener("mouseenter", show);
      node.addEventListener("mouseleave", hide);
      node.addEventListener("touchstart", (e) => {
        show(e);
        setTimeout(hide, 1800);
      }, { passive: true });
    });
  }

  async function initAnimations() {
    const slots = document.querySelectorAll("[data-anim]");
    await Promise.all(Array.from(slots).map(async (slot) => {
      const src = slot.getAttribute("data-anim");
      const accent = slot.getAttribute("data-accent");
      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const text = await res.text();
        slot.innerHTML = text;
        const svg = slot.querySelector("svg");
        if (svg) {
          if (accent) svg.style.setProperty("--accent", accent);
          attachStageTooltips(svg);
        }
      } catch (_) {
        // Ignore fetch errors in non-server contexts
      }
    }));
  }

  function initFilters() {
    const tabs = document.querySelectorAll(".filter-tab");
    const cards = document.querySelectorAll(".usecase-card");
    if (!tabs.length || !cards.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const cat = tab.getAttribute("data-filter");
        tabs.forEach((t) => t.setAttribute("aria-pressed", String(t === tab)));
        cards.forEach((card) => {
          const match = cat === "all" || card.getAttribute("data-category") === cat;
          card.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initCTAs();
    initFilters();
    initAnimations();
  });
})();
