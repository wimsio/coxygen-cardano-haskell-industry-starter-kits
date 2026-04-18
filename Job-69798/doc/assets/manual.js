
(function(){
  const shell = document.querySelector('.manual-shell');
  const menuBtn = document.getElementById('menuToggle');
  const searchToggle = document.getElementById('searchToggle');
  const searchWrap = document.getElementById('searchWrap');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const printBtn = document.getElementById('printBtn');

  if(menuBtn && shell){
    const saved = localStorage.getItem('coxyManualSidebar');
    if(saved === 'collapsed') shell.classList.add('collapsed');
    menuBtn.addEventListener('click', () => {
      shell.classList.toggle('collapsed');
      localStorage.setItem('coxyManualSidebar', shell.classList.contains('collapsed') ? 'collapsed' : 'open');
    });
  }

  if(searchToggle && searchWrap){
    searchToggle.addEventListener('click', () => {
      searchWrap.classList.toggle('open');
      if(searchWrap.classList.contains('open') && searchInput) searchInput.focus();
      if(!searchWrap.classList.contains('open') && searchResults){
        searchResults.classList.remove('show');
        searchResults.innerHTML = '';
      }
    });
  }

  if(printBtn){
    printBtn.addEventListener('click', () => window.print());
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function highlight(text, query){
    if(!query) return esc(text);
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return esc(text).replace(new RegExp(safe, 'ig'), m => `<mark>${m}</mark>`);
  }

  function renderResults(q){
    if(!searchResults) return;
    const query = q.trim().toLowerCase();
    if(!query){
      searchResults.classList.remove('show');
      searchResults.innerHTML = '';
      return;
    }

    const matches = (window.MANUAL_INDEX || []).filter(item => {
      const hay = (item.title + ' ' + item.keywords).toLowerCase();
      return hay.includes(query);
    }).slice(0, 10);

    if(!matches.length){
      searchResults.innerHTML = '<li><a href="#"><strong>No results</strong><span>Try another keyword like membership, deposit, cover, claim, governance, or admin.</span></a></li>';
      searchResults.classList.add('show');
      return;
    }

    searchResults.innerHTML = matches.map(item => {
      const excerpt = item.keywords.split(' ').slice(0, 18).join(' ') + '...';
      return `<li><a href="${item.url}"><strong>${highlight(item.title, query)}</strong><span>${highlight(excerpt, query)}</span></a></li>`;
    }).join('');
    searchResults.classList.add('show');
  }

  if(searchInput){
    searchInput.addEventListener('input', e => renderResults(e.target.value));
    searchInput.addEventListener('keydown', e => {
      if(e.key === 'Enter'){
        const query = e.target.value.trim().toLowerCase();
        const first = (window.MANUAL_INDEX || []).find(item => (item.title + ' ' + item.keywords).toLowerCase().includes(query));
        if(first) window.location.href = first.url;
      }
    });
  }

  document.addEventListener('click', (e) => {
    if(searchWrap && !searchWrap.contains(e.target) && searchResults && !searchResults.contains(e.target)){
      searchResults.classList.remove('show');
    }
  });
})();
