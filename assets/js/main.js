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
          if (slot.id === "player-stage") {
            initStepPlayer(svg);
          }
        }
      } catch (_) {
        // Ignore fetch errors in non-server contexts
      }
    }));
  }

  function initStepPlayer(svg) {
    const capEl = document.getElementById("player-caption");
    const toggleBtn = document.getElementById("player-toggle");
    const prevBtn = document.getElementById("player-prev");
    const nextBtn = document.getElementById("player-next");
    const stagesData = window.ENABLLY_STAGES || [];
    if (!capEl || !toggleBtn || !prevBtn || !nextBtn || !stagesData.length) return;

    let current = -1; // -1 = free-running loop
    let paused = false;

    function renderStep() {
      svg.querySelectorAll(".node").forEach((n) => n.classList.remove("is-active-stage"));
      if (current < 0) {
        svg.classList.remove("is-stepping");
        capEl.innerHTML = "<strong>Playing full workflow</strong> — click Prev / Next to step through each stage.";
        return;
      }
      svg.classList.add("is-stepping");
      const stageId = `stage-${current + 1}`;
      const target = svg.querySelector(`#${stageId}`);
      if (target) target.classList.add("is-active-stage");
      const item = stagesData[current];
      capEl.innerHTML = `<strong>Stage ${current + 1} of ${stagesData.length}:</strong> ${item}`;
    }

    toggleBtn.addEventListener("click", () => {
      paused = !paused;
      svg.classList.toggle("is-paused", paused);
      toggleBtn.textContent = paused ? "Play" : "Pause";
    });

    prevBtn.addEventListener("click", () => {
      current = current <= 0 ? stagesData.length - 1 : current - 1;
      renderStep();
    });

    nextBtn.addEventListener("click", () => {
      current = current >= stagesData.length - 1 ? 0 : current + 1;
      renderStep();
    });

    svg.querySelectorAll(".node").forEach((node) => {
      const m = /^stage-(\d+)$/.exec(node.id);
      if (!m) return;
      node.addEventListener("click", () => {
        const idx = parseInt(m[1], 10) - 1;
        if (idx >= 0 && idx < stagesData.length) {
          current = idx;
          renderStep();
        }
      });
    });

    renderStep();
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

  function initHeroShowcase() {
    const tabs = document.querySelectorAll(".uc-tab");
    const stageCard = document.getElementById("hero-stage-card");
    const stageAnim = document.getElementById("hero-stage-anim");
    const stageCat = document.getElementById("hero-stage-cat");
    const stageTitle = document.getElementById("hero-stage-title");
    const stageDesc = document.getElementById("hero-stage-desc");
    const stageLink = document.getElementById("hero-stage-link");
    if (!tabs.length || !stageCard || !stageAnim) return;

    const svgCache = new Map();
    let activeSlug = null;

    async function selectTab(tab) {
      const slug = tab.getAttribute("data-slug");
      if (!slug || slug === activeSlug) return;
      activeSlug = slug;

      const title = tab.getAttribute("data-title");
      const desc = tab.getAttribute("data-desc");
      const cat = tab.getAttribute("data-category");
      const accent = tab.getAttribute("data-accent");
      const animSrc = tab.getAttribute("data-anim");

      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      stageCard.classList.add("is-switching");
      stageCard.style.setProperty("--card-accent", accent);
      stageCat.textContent = cat;
      stageCat.style.setProperty("--card-accent", accent);
      stageTitle.textContent = title;
      stageDesc.textContent = desc;
      stageLink.setAttribute("href", `use-cases/${slug}.html`);

      let svgText = svgCache.get(animSrc);
      if (!svgText) {
        try {
          const res = await fetch(animSrc);
          if (res.ok) {
            svgText = await res.text();
            svgCache.set(animSrc, svgText);
          }
        } catch (_) {
          // Ignore fetch errors in non-server contexts
        }
      }

      if (activeSlug !== slug) return;
      if (svgText) {
        stageAnim.innerHTML = svgText;
        const svg = stageAnim.querySelector("svg");
        if (svg) {
          if (accent) svg.style.setProperty("--accent", accent);
          attachStageTooltips(svg);
        }
      }
      requestAnimationFrame(() => stageCard.classList.remove("is-switching"));
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => selectTab(tab));
    });

    selectTab(tabs[0]);
  }

  function initWhatsAppFloat() {
    if (document.querySelector(".wa-float")) return;
    const url = window.CTA_URL || "#contact";
    const btn = document.createElement("a");
    btn.className = "wa-float";
    btn.href = url;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.setAttribute("aria-label", "Chat with us on WhatsApp");
    btn.innerHTML = `
      <span class="wa-float-tip">Chat with us on WhatsApp</span>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 3C8.82 3 3 8.82 3 16c0 2.31.61 4.56 1.77 6.55L3 29l6.63-1.74A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.6c-2.01 0-3.98-.54-5.7-1.56l-.41-.24-3.93 1.03 1.05-3.83-.27-.42A10.56 10.56 0 0 1 5.4 16C5.4 10.16 10.16 5.4 16 5.4S26.6 10.16 26.6 16 21.84 26.6 16 26.6zm5.8-7.92c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.58-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.36-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.37.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z"/>
      </svg>
    `;
    document.body.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initCTAs();
    initFilters();
    initHeroShowcase();
    initAnimations();
    initWhatsAppFloat();
  });
})();
