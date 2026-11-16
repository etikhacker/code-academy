/* =========================================================
   Netflix Azərbaycan — tətbiq məntiqi (vanilla JS)
   Film məlumatları yalnız films.js-dəki FILMS massivindən oxunur.
   ========================================================= */
(() => {
  'use strict';

  const LOCALE = 'az';
  const STORAGE_KEY = 'netflixAz.myList';
  const CLASSIC_BEFORE = 1991;
  const YT_ID = /^[A-Za-z0-9_-]{11}$/;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => motionQuery.matches;

  /* ---------- Köməkçilər ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key === 'svg') el.innerHTML = value; // yalnız aşağıdakı statik ikonlar üçün
      else if (key === 'style') el.setAttribute('style', value);
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat()) {
      if (child != null && child !== false) el.append(child);
    }
    return el;
  }

  const ICONS = {
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    dice: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'
  };

  /** Azərbaycan hərflərini düzgün müqayisə etmək üçün normallaşdırma (İ→i, I→ı və s.). */
  const normalize = (str) => String(str ?? '').normalize('NFC').toLocaleLowerCase(LOCALE).trim();

  const isHttpUrl = (str) => {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const hashHue = (str) => {
    let hash = 0;
    for (const ch of String(str)) hash = (hash * 31 + ch.codePointAt(0)) | 0;
    return Math.abs(hash) % 360;
  };

  const filmWord = (n) => `${n} film`;

  /* ---------- Məlumat (films.js) ---------- */
  const rawFilms = (typeof FILMS !== 'undefined' && Array.isArray(FILMS)) ? FILMS : [];
  const films = [];
  const seenIds = new Set();

  for (const item of rawFilms) {
    if (!item || item.id == null || String(item.id).trim() === '' || !item.title) {
      console.warn('[films.js] id və ya title olmayan yazı ötürüldü:', item);
      continue;
    }
    const id = String(item.id).trim();
    if (seenIds.has(id)) {
      console.warn(`[films.js] Təkrarlanan id ötürüldü: "${id}"`);
      continue;
    }
    seenIds.add(id);
    const year = Number.parseInt(item.year, 10);
    const trailer = String(item.trailerYoutubeId ?? '').trim();
    if (trailer && !YT_ID.test(trailer)) {
      console.warn(`[films.js] "${id}" üçün trailerYoutubeId düzgün deyil (11 simvol olmalıdır).`);
    }
    films.push({
      id,
      title: String(item.title).trim(),
      year: Number.isFinite(year) ? year : null,
      genre: String(item.genre ?? '').trim(),
      description: String(item.description ?? '').trim(),
      source: String(item.source ?? '').trim(),
      poster: String(item.poster ?? '').trim(),
      trailerYoutubeId: YT_ID.test(trailer) ? trailer : '',
      featured: item.featured === true,
      searchKey: normalize(item.title)
    });
  }

  const filmById = new Map(films.map((f) => [f.id, f]));
  const genres = [...new Set(films.map((f) => f.genre).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, LOCALE));

  /* ---------- Siyahım (localStorage) ---------- */
  const store = {
    read() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? [...new Set(parsed.map(String))] : [];
      } catch {
        return [];
      }
    },
    write(ids) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        return true;
      } catch {
        return false;
      }
    }
  };

  let myList = store.read();
  const isInList = (id) => myList.includes(id);

  function toggleList(id, sourceButton) {
    const film = filmById.get(id);
    if (!film) return;
    const adding = !isInList(id);
    myList = adding ? [...myList.filter((x) => x !== id), id] : myList.filter((x) => x !== id);
    const saved = store.write(myList);

    refreshListState({ pulseId: adding ? id : null, sourceButton });
    renderSection(sectionByKey.mylist);

    if (!saved) {
      toast('Siyahı bu brauzerdə yadda saxlanıla bilmədi.', 'muted');
    } else if (adding) {
      toast(`“${film.title}” siyahıya əlavə edildi`);
    } else {
      toast(`“${film.title}” siyahıdan çıxarıldı`, 'muted');
    }
  }

  /* ---------- Filtr vəziyyəti ---------- */
  const state = { query: '', genre: '' };

  const matchesFilters = (film) =>
    (!state.genre || film.genre === state.genre) &&
    (!state.query || film.searchKey.includes(state.query));

  const filtersActive = () => Boolean(state.query || state.genre);

  /* ---------- DOM elementləri ---------- */
  const els = {
    topbar: $('#topbar'),
    search: $('#search'),
    genre: $('#genre'),
    filtersToggle: $('#filtersToggle'),
    pickBtn: $('#pickBtn'),
    listCount: $('#listCount'),
    heroBg: $('#heroBg'),
    heroTitle: $('#heroTitle'),
    heroMeta: $('#heroMeta'),
    heroDesc: $('#heroDesc'),
    heroActions: $('#heroActions'),
    heroMore: $('#heroMore'),
    heroList: $('#heroList'),
    modal: $('#modal'),
    modalDialog: $('#modal .modal__dialog'),
    modalClose: $('#modalClose'),
    modalPoster: $('#modalPoster'),
    modalTitle: $('#modalTitle'),
    modalMeta: $('#modalMeta'),
    modalDesc: $('#modalDesc'),
    modalSource: $('#modalSource'),
    modalTrailer: $('#modalTrailer'),
    modalList: $('#modalList'),
    modalVideo: $('#modalVideo'),
    picker: $('#picker'),
    pickerClose: $('#pickerClose'),
    pickerGenre: $('#pickerGenre'),
    pickerStage: $('#pickerStage'),
    pickerStatus: $('#pickerStatus'),
    toasts: $('#toasts')
  };

  /* ---------- Poster ---------- */
  function createFallback(film) {
    return h('div', { class: 'poster__fallback', style: `--h:${hashHue(film.title)}`, 'aria-hidden': 'true' },
      h('span', { class: 'poster__title', text: film.title }),
      h('span', { class: 'poster__note', text: 'Poster əlavə edilməyib' })
    );
  }

  function createPoster(film, { mini = false, eager = false } = {}) {
    const wrap = h('div', { class: mini ? 'poster poster--mini' : 'poster' });
    if (!film.poster) {
      wrap.append(createFallback(film));
      return wrap;
    }
    wrap.classList.add('is-loading');
    const img = h('img', {
      alt: mini ? '' : `${film.title} — poster`,
      loading: eager ? 'eager' : 'lazy',
      decoding: 'async'
    });
    img.addEventListener('load', () => wrap.classList.remove('is-loading'), { once: true });
    img.addEventListener('error', () => {
      img.remove();
      wrap.classList.remove('is-loading');
      wrap.append(createFallback(film));
    }, { once: true });
    img.src = film.poster;
    wrap.append(img);
    return wrap;
  }

  const metaText = (film) => [film.year, film.genre].filter(Boolean).join(' · ');

  /* ---------- Siyahı düymələri ---------- */
  function paintListButton(btn, film) {
    const inList = isInList(film.id);
    btn.classList.toggle('is-in', inList);
    btn.setAttribute('aria-pressed', String(inList));

    if (btn.classList.contains('card__list')) {
      btn.innerHTML = inList ? ICONS.check : ICONS.plus;
      btn.setAttribute('aria-label', inList
        ? `“${film.title}” siyahıdadır — siyahıdan çıxar`
        : `“${film.title}” filmini siyahıma əlavə et`);
      btn.title = inList ? 'Siyahıdan çıxar' : 'Siyahıma əlavə et';
      return;
    }
    btn.replaceChildren(
      h('span', { class: 'btn__icon', svg: inList ? ICONS.check : ICONS.plus }),
      h('span', { class: 'btn__label', text: inList ? 'Siyahıdan çıxar' : 'Siyahıma əlavə et' })
    );
  }

  function pulse(el) {
    if (reducedMotion()) return;
    el.classList.remove('is-pulse');
    void el.offsetWidth; // animasiyanı yenidən başlatmaq üçün
    el.classList.add('is-pulse');
    el.addEventListener('animationend', () => el.classList.remove('is-pulse'), { once: true });
  }

  /** Bütün siyahı düymələrini (kart, hero, modal) və sayğacı yeniləyir. */
  function refreshListState({ pulseId = null, sourceButton = null } = {}) {
    $$('[data-list-id]').forEach((btn) => {
      const film = filmById.get(btn.dataset.listId);
      if (!film) return;
      paintListButton(btn, film);
      if (pulseId && btn.dataset.listId === pulseId && (btn === sourceButton || !sourceButton)) pulse(btn);
    });
    const count = myList.filter((id) => filmById.has(id)).length;
    els.listCount.textContent = String(count);
    els.listCount.setAttribute('aria-label', filmWord(count));
    if (pulseId) pulse(els.listCount);
  }

  /* ---------- Kart ---------- */
  function createCard(film) {
    const listBtn = h('button', {
      type: 'button',
      class: 'card__list',
      'data-list-id': film.id
    });
    listBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleList(film.id, listBtn);
    });
    paintListButton(listBtn, film);

    const openBtn = h('button', { type: 'button', class: 'card__open' },
      h('div', { class: 'card__media' },
        h('div', { class: 'poster-slot' }),
      ),
      h('div', { class: 'card__info' },
        h('h3', { class: 'card__title', text: film.title }),
        h('p', { class: 'card__meta', text: metaText(film) })
      )
    );
    const poster = createPoster(film);
    poster.append(
      h('div', { class: 'card__panel', 'aria-hidden': 'true' },
        film.description ? h('p', { class: 'card__panel-desc', text: film.description }) : null,
        h('span', { class: 'card__panel-more' }, 'Ətraflı ', h('span', { svg: ICONS.arrow }))
      )
    );
    $('.poster-slot', openBtn).replaceWith(poster);
    openBtn.addEventListener('click', () => openModal(film.id, openBtn));

    // Siyahı düyməsi açma düyməsinin içində deyil, yanında durur (düymə içində düymə olmasın).
    return h('li', { class: 'card', 'data-id': film.id },
      h('div', { class: 'card__inner' }, openBtn, listBtn)
    );
  }

  /* ---------- Bölmələr ---------- */
  const sections = [
    {
      key: 'all',
      el: $('#kino'),
      source: () => films,
      emptyAll: () => ({
        title: 'Hələ film əlavə edilməyib',
        text: 'Filmləri films.js faylına əlavə etdikdən sonra onlar burada görünəcək.'
      })
    },
    {
      key: 'classics',
      el: $('#klassikler'),
      source: () => films.filter((f) => f.year !== null && f.year < CLASSIC_BEFORE),
      emptyAll: () => ({
        title: 'Bu bölmədə hələ film yoxdur',
        text: `${CLASSIC_BEFORE}-ci ildən əvvəl çəkilmiş filmlər avtomatik olaraq burada görünür.`
      })
    },
    {
      key: 'mylist',
      el: $('#siyahim'),
      // ən son əlavə edilən birinci
      source: () => myList.slice().reverse().map((id) => filmById.get(id)).filter(Boolean),
      emptyAll: () => ({
        title: 'Siyahınız hələ boşdur',
        text: 'Film əlavə etmək üçün kartın küncündəki “+” düyməsinə və ya filmin pəncərəsindəki “Siyahıma əlavə et” düyməsinə basın. Əlavə etdiyiniz filmlər burada toplanacaq.'
      })
    }
  ];
  const sectionByKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  sections.forEach((s) => {
    s.row = $('[data-row]', s.el);
    s.track = $('[data-track]', s.el);
    s.empty = $('[data-empty]', s.el);
    s.count = $('[data-count]', s.el);
    s.prev = $('.row__arrow--prev', s.el);
    s.next = $('.row__arrow--next', s.el);
  });

  function renderEmpty(sec, { title, text, reset }) {
    sec.empty.replaceChildren(...[
      h('strong', { text: title }),
      text ? h('p', { text }) : null,
      reset ? h('button', { type: 'button', class: 'btn btn--primary', 'data-reset': '', onclick: resetFilters }, 'Filtrləri sıfırla') : null
    ].filter(Boolean));
  }

  function renderSection(sec) {
    const all = sec.source();
    const visible = all.filter(matchesFilters);

    sec.count.textContent = all.length
      ? (filtersActive() ? `${visible.length} / ${all.length}` : filmWord(all.length))
      : '';

    if (!all.length) {
      sec.row.hidden = true;
      sec.empty.hidden = false;
      renderEmpty(sec, sec.emptyAll());
      sec.track.replaceChildren();
      return;
    }
    if (!visible.length) {
      sec.row.hidden = true;
      sec.empty.hidden = false;
      renderEmpty(sec, {
        title: 'Uyğun film tapılmadı',
        text: 'Axtarış sözünü və ya janrı dəyişin, yaxud filtrləri sıfırlayın.',
        reset: true
      });
      sec.track.replaceChildren();
      return;
    }

    sec.row.hidden = false;
    sec.empty.hidden = true;
    sec.empty.replaceChildren();

    // Mövcud kartları təkrar istifadə et ki, animasiya hər dəfə yenidən başlamasın.
    const existing = new Map($$(':scope > .card', sec.track).map((el) => [el.dataset.id, el]));
    const wanted = new Set(visible.map((f) => f.id));
    existing.forEach((el, id) => { if (!wanted.has(id)) el.remove(); });

    visible.forEach((film, index) => {
      let card = existing.get(film.id);
      if (!card) {
        card = createCard(film);
        card.style.setProperty('--i', String(Math.min(index, 10)));
      }
      const current = sec.track.children[index];
      if (current !== card) sec.track.insertBefore(card, current || null);
    });

    requestAnimationFrame(() => updateArrows(sec));
  }

  function renderAll() {
    sections.forEach(renderSection);
  }

  /* ---------- Üfüqi sıra oxları ---------- */
  function updateArrows(sec) {
    const t = sec.track;
    const max = t.scrollWidth - t.clientWidth;
    sec.prev.disabled = t.scrollLeft <= 4;
    sec.next.disabled = t.scrollLeft >= max - 4;
  }

  sections.forEach((sec) => {
    [sec.prev, sec.next].forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.dir);
        sec.track.scrollBy({
          left: dir * sec.track.clientWidth * 0.85,
          behavior: reducedMotion() ? 'auto' : 'smooth'
        });
      });
    });
    let raf = 0;
    sec.track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateArrows(sec));
    }, { passive: true });
  });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => sections.forEach(updateArrows));
    sections.forEach((s) => ro.observe(s.track));
  }

  /* ---------- Kartların scroll ilə görünməsi (stagger) ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    sections.forEach((s) => io.observe(s.track));
  } else {
    sections.forEach((s) => s.track.classList.add('is-visible'));
  }

  /* ---------- Hero ---------- */
  const featured = films.find((f) => f.featured) || films[0] || null;

  function renderHero() {
    els.heroBg.replaceChildren();
    if (!featured) {
      els.heroBg.className = 'hero__bg hero__bg--art';
      els.heroTitle.textContent = 'Netflix Azərbaycan';
      els.heroMeta.replaceChildren();
      els.heroDesc.textContent = 'Hələ film əlavə edilməyib. Filmləri films.js faylına əlavə edin.';
      els.heroActions.hidden = true;
      return;
    }
    if (featured.poster) {
      els.heroBg.className = 'hero__bg hero__bg--art';
      const img = h('img', { alt: '', decoding: 'async', fetchpriority: 'high' });
      img.addEventListener('error', () => img.remove(), { once: true });
      img.src = featured.poster;
      els.heroBg.append(img);
    } else {
      els.heroBg.className = 'hero__bg hero__bg--art';
    }
    els.heroTitle.textContent = featured.title;
    els.heroMeta.replaceChildren(
      ...[featured.year, featured.genre].filter(Boolean).map((v, i) =>
        h('span', { class: i === 0 ? 'chip chip--red' : 'chip', text: String(v) }))
    );
    els.heroDesc.textContent = featured.description;
    els.heroList.dataset.listId = featured.id;
    paintListButton(els.heroList, featured);
    els.heroMore.addEventListener('click', () => openModal(featured.id, els.heroMore));
    els.heroList.addEventListener('click', () => toggleList(featured.id, els.heroList));
  }

  /* ---------- Modal ---------- */
  let modalFilmId = null;
  let modalOpener = null;
  let modalCloseTimer = 0;
  const backgroundEls = [els.topbar, $('#main'), $('.footer'), els.picker, $('.skip-link')];

  function openModal(id, opener) {
    const film = filmById.get(id);
    if (!film) return;
    clearTimeout(modalCloseTimer);
    modalFilmId = id;
    modalOpener = opener || document.activeElement;

    els.modalPoster.replaceChildren(createPoster(film, { eager: true }));
    els.modalTitle.textContent = film.title;
    els.modalMeta.replaceChildren(
      ...(film.year ? [h('span', { class: 'chip chip--red', text: `İl: ${film.year}` })] : []),
      ...(film.genre ? [h('span', { class: 'chip', text: `Janr: ${film.genre}` })] : [])
    );
    els.modalDesc.textContent = film.description || 'Təsvir əlavə edilməyib.';

    if (film.source && isHttpUrl(film.source)) {
      const host = new URL(film.source).hostname.replace(/^www\./, '');
      els.modalSource.replaceChildren(
        'Mənbə: ',
        h('a', { href: film.source, target: '_blank', rel: 'noopener noreferrer', text: host }),
        h('span', { class: 'visually-hidden', text: ' (yeni pəncərədə açılır)' })
      );
    } else {
      els.modalSource.textContent = 'Mənbə göstərilməyib.';
    }

    els.modalList.dataset.listId = film.id;
    paintListButton(els.modalList, film);

    removeTrailer();
    els.modalTrailer.hidden = !film.trailerYoutubeId;

    // body scroll-unu blokla, arxa fonu əlçatmaz et
    document.body.classList.add('is-locked');
    backgroundEls.forEach((el) => el && el.setAttribute('inert', ''));

    els.modal.hidden = false;
    els.modalDialog.scrollTop = 0;
    void els.modal.offsetWidth; // keçid animasiyası üçün
    els.modal.classList.add('is-open');
    els.modalClose.focus({ preventScroll: true });
  }

  function closeModal() {
    if (els.modal.hidden || !els.modal.classList.contains('is-open')) return;
    removeTrailer(); // video dərhal dayansın
    els.modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    backgroundEls.forEach((el) => el && el.removeAttribute('inert'));
    modalFilmId = null;

    const opener = modalOpener;
    modalOpener = null;
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });

    modalCloseTimer = setTimeout(() => { els.modal.hidden = true; }, reducedMotion() ? 0 : 320);
  }

  function removeTrailer() {
    els.modalVideo.replaceChildren();
    els.modalVideo.hidden = true;
  }

  function playTrailer() {
    const film = filmById.get(modalFilmId);
    if (!film || !film.trailerYoutubeId) return;
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(film.trailerYoutubeId)}?autoplay=1&rel=0&modestbranding=1`;
    const iframe = h('iframe', {
      src,
      title: `${film.title} — treyler`,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: true,
      referrerpolicy: 'strict-origin-when-cross-origin',
      loading: 'eager'
    });
    els.modalVideo.replaceChildren(iframe);
    els.modalVideo.hidden = false;
    els.modalVideo.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  els.modalClose.addEventListener('click', closeModal);
  $('[data-modal-backdrop]').addEventListener('click', closeModal);
  els.modalTrailer.addEventListener('click', playTrailer);
  els.modalList.addEventListener('click', () => {
    if (modalFilmId) toggleList(modalFilmId, els.modalList);
  });

  // Fokus modalın içində qalsın
  els.modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$('button:not([hidden]):not([disabled]), a[href], iframe', els.modalDialog)
      .filter((el) => el.offsetParent !== null || el.tagName === 'IFRAME');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === els.modalDialog)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------- Toast ---------- */
  function toast(message, variant = '') {
    const el = h('div', { class: `toast${variant ? ` toast--${variant}` : ''}` },
      h('span', { class: 'toast__icon', svg: variant === 'muted' ? ICONS.minus : ICONS.check }),
      h('span', { text: message })
    );
    els.toasts.append(el);
    while (els.toasts.children.length > 3) els.toasts.firstElementChild.remove();
    setTimeout(() => {
      if (reducedMotion()) { el.remove(); return; }
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 600);
    }, 2600);
  }

  /* ---------- "Mənə film seç" ---------- */
  let spinTimer = 0;
  let pickerOpener = null;

  function slotItem(film) {
    return h('div', { class: 'slot__item' },
      createPoster(film, { mini: true }),
      h('div', { class: 'slot__text' },
        h('p', { class: 'slot__title', text: film.title }),
        h('p', { class: 'slot__meta', text: metaText(film) })
      )
    );
  }

  function openPicker() {
    els.picker.classList.remove('is-closing');
    els.picker.hidden = false;
  }

  function closePicker({ restoreFocus = true } = {}) {
    if (els.picker.hidden) return;
    clearTimeout(spinTimer);
    els.pickBtn.disabled = false;
    const finish = () => {
      els.picker.hidden = true;
      els.picker.classList.remove('is-closing');
    };
    if (reducedMotion()) finish();
    else {
      els.picker.classList.add('is-closing');
      setTimeout(finish, 250);
    }
    if (restoreFocus && els.picker.contains(document.activeElement)) {
      (pickerOpener && document.contains(pickerOpener) ? pickerOpener : els.pickBtn).focus({ preventScroll: true });
    }
  }

  function pickFilm() {
    clearTimeout(spinTimer);
    pickerOpener = els.pickBtn;
    const genre = state.genre; // axtarış mətni nəzərə alınmır
    const pool = genre ? films.filter((f) => f.genre === genre) : films;
    els.pickerGenre.textContent = `Janr: ${genre || 'Bütün janrlar'}`;
    openPicker();

    if (!pool.length) {
      const msg = genre
        ? `“${genre}” janrında film yoxdur. Başqa janr seçin və ya “Bütün janrlar”ı seçin.`
        : 'Hələ film əlavə edilməyib, seçmək üçün film yoxdur.';
      els.pickerStage.replaceChildren(h('p', { class: 'picker__msg', text: msg }));
      els.pickerStatus.textContent = msg;
      els.pickerClose.focus({ preventScroll: true });
      return;
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const slot = h('div', { class: 'slot' });
    els.pickerStage.replaceChildren(h('p', { class: 'picker__label', text: 'Seçilir…' }), slot);
    els.pickerStatus.textContent = 'Film seçilir…';

    if (reducedMotion()) {
      showPick(chosen, slot);
      return;
    }

    // Rulet: sürətlə başlayır, tədricən yavaşlayır
    els.pickBtn.disabled = true;
    slot.classList.add('is-spinning');
    const steps = 16;
    let step = 0;
    let lastId = null;

    const tick = () => {
      step += 1;
      let film;
      if (step >= steps) film = chosen;
      else {
        const options = pool.length > 1 ? pool.filter((f) => f.id !== lastId) : pool;
        film = options[Math.floor(Math.random() * options.length)];
      }
      lastId = film.id;
      slot.replaceChildren(slotItem(film));
      if (step >= steps) {
        showPick(chosen, slot);
        return;
      }
      const delay = 55 + Math.pow(step / steps, 2.2) * 260;
      spinTimer = setTimeout(tick, delay);
    };
    tick();
  }

  function showPick(film, slot) {
    els.pickBtn.disabled = false;
    slot.classList.remove('is-spinning');
    slot.replaceChildren(slotItem(film));
    void slot.offsetWidth;
    slot.classList.add('is-final');
    const label = $('.picker__label', els.pickerStage);
    if (label) label.textContent = 'Bu gün izləməyə dəyər';

    const moreBtn = h('button', { type: 'button', class: 'btn btn--primary', svg: '' });
    moreBtn.append(h('span', { svg: ICONS.info }), h('span', { text: 'Ətraflı' }));
    moreBtn.addEventListener('click', () => openModal(film.id, moreBtn));

    const againBtn = h('button', { type: 'button', class: 'btn btn--ghost' });
    againBtn.append(h('span', { svg: ICONS.dice }), h('span', { text: 'Yenidən seç' }));
    againBtn.addEventListener('click', pickFilm);

    els.pickerStage.append(h('div', { class: 'picker__actions' }, moreBtn, againBtn));
    els.pickerStatus.textContent = `Seçilmiş film: ${film.title}`;
    moreBtn.focus({ preventScroll: true });
  }

  els.pickBtn.addEventListener('click', pickFilm);
  els.pickerClose.addEventListener('click', () => closePicker());

  /* ---------- Axtarış və janr ---------- */
  function populateGenres() {
    const frag = document.createDocumentFragment();
    genres.forEach((g) => frag.append(h('option', { value: g, text: g })));
    els.genre.append(frag);
  }

  let searchTimer = 0;
  els.search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = normalize(els.search.value);
      renderAll();
    }, 120);
  });
  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchTimer);
      state.query = normalize(els.search.value);
      renderAll();
    }
  });
  els.genre.addEventListener('change', () => {
    state.genre = els.genre.value;
    renderAll();
  });

  function resetFilters() {
    clearTimeout(searchTimer);
    state.query = '';
    state.genre = '';
    els.search.value = '';
    els.genre.value = '';
    renderAll();
    els.search.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 719.98px)').matches) setFiltersOpen(true);
  }

  /* ---------- Telefon: filtr paneli ---------- */
  function setFiltersOpen(open) {
    els.topbar.classList.toggle('is-open', open);
    els.filtersToggle.setAttribute('aria-expanded', String(open));
    updateHeader();
  }
  els.filtersToggle.addEventListener('click', () => {
    const open = !els.topbar.classList.contains('is-open');
    setFiltersOpen(open);
    if (open) els.search.focus({ preventScroll: true });
  });

  /* ---------- Menyu fonu scroll ilə ---------- */
  function updateHeader() {
    const solid = window.scrollY > 24 || els.topbar.classList.contains('is-open');
    els.topbar.classList.toggle('is-solid', solid);
  }
  let headerRaf = 0;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(headerRaf);
    headerRaf = requestAnimationFrame(updateHeader);
  }, { passive: true });

  /* ---------- Klaviatura ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!els.modal.hidden && els.modal.classList.contains('is-open')) {
      e.preventDefault();
      closeModal();
    } else if (!els.picker.hidden) {
      closePicker();
    }
  });

  /* ---------- Başqa tabda dəyişiklik ---------- */
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    myList = store.read();
    refreshListState();
    renderSection(sectionByKey.mylist);
  });

  /* ---------- Başlanğıc ---------- */
  populateGenres();
  renderHero();
  renderAll();
  refreshListState();
  updateHeader();
})();
