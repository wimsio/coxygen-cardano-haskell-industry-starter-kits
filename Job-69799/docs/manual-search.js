(function () {
  const searchInput = document.getElementById("manualSearchInput");
  const searchBtn = document.getElementById("toggleSearchBtn");
  const resultsBox = document.getElementById("manualSearchResults");

  if (!searchInput || !searchBtn || !resultsBox || !window.MANUAL_SEARCH_INDEX) return;

  function normalize(text) {
    return String(text || "").toLowerCase().trim();
  }

  function scoreMatch(query, text) {
    const q = normalize(query);
    const t = normalize(text);

    if (!q || !t) return 0;
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(q)) return 50;
    return 0;
  }

  function searchManual(query) {
    const q = normalize(query);
    if (!q) return [];

    const results = [];

    window.MANUAL_SEARCH_INDEX.forEach(page => {
      let pageScore = 0;

      pageScore = Math.max(pageScore, scoreMatch(q, page.title));

      (page.keywords || []).forEach(k => {
        pageScore = Math.max(pageScore, scoreMatch(q, k));
      });

      if (pageScore > 0) {
        results.push({
          type: "page",
          title: page.title,
          subtitle: "Page",
          url: page.url,
          score: pageScore
        });
      }

      (page.sections || []).forEach(section => {
        let sectionScore = 0;
        sectionScore = Math.max(sectionScore, scoreMatch(q, section.title));

        (section.keywords || []).forEach(k => {
          sectionScore = Math.max(sectionScore, scoreMatch(q, k));
        });

        if (sectionScore > 0) {
          results.push({
            type: "section",
            title: section.title,
            subtitle: page.title,
            url: section.url,
            score: sectionScore
          });
        }
      });
    });

    return results
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);
  }

  function clearResults() {
    resultsBox.innerHTML = "";
    resultsBox.classList.remove("active");
  }

  function renderResults(results, query) {
    resultsBox.innerHTML = "";

    if (!query.trim()) {
      clearResults();
      return;
    }

    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "search-result-empty";
      empty.textContent = `No results found for "${query}"`;
      resultsBox.appendChild(empty);
      resultsBox.classList.add("active");
      return;
    }

    results.forEach(item => {
      const link = document.createElement("a");
      link.className = "search-result-item";
      link.href = item.url;

      const title = document.createElement("div");
      title.className = "search-result-title";
      title.textContent = item.title;

      const meta = document.createElement("div");
      meta.className = "search-result-meta";
      meta.textContent = item.subtitle;

      link.appendChild(title);
      link.appendChild(meta);
      resultsBox.appendChild(link);
    });

    resultsBox.classList.add("active");
  }

  searchBtn.addEventListener("click", function () {
    searchInput.classList.toggle("active");

    if (searchInput.classList.contains("active")) {
      searchInput.focus();
    } else {
      searchInput.value = "";
      clearResults();
    }
  });

  searchInput.addEventListener("input", function () {
    const query = this.value;
    const results = searchManual(query);
    renderResults(results, query);
  });

  document.addEventListener("click", function (e) {
    const searchWrap = document.querySelector(".topbar-left");
    if (searchWrap && !searchWrap.contains(e.target)) {
      clearResults();
    }
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      clearResults();
      searchInput.blur();
    }
  });
})();