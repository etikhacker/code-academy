/* =========================================================
   Netflix Azərbaycan — tətbiq məntiqi (vanilla JS)
   Film məlumatları yalnız films.js-dəki FILMS massivindən oxunur.
   Bütün bölmələr (hero, janr sıraları, onilliklər, Top 10, rəqəmlər)
   bu məlumatdan avtomatik yaranır.
   ========================================================= */
(() => {
  'use strict';

  const LOCALE = 'az';
  const STORAGE_KEY = 'netflixAz.myList';
  const CLASSIC_BEFORE = 1991;
  const SLIDE_MS = 7000;
  const HERO_FALLBACK_COUNT = 5;
  const TOP_COUNT = 10;
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

  const arrowSvg = (dir) => `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="${dir < 0 ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const ICONS = {
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    infoSmall: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
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

  const hashOf = (str) => {
    let hash = 2166136261;
    for (const ch of String(str)) {
      hash ^= ch.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  /** Film id-sindən sabit, fərqli tünd qradiyent parametrləri. */
  const paletteOf = (film) => {
    const n = hashOf(film.id);
    const h1 = n % 360;
    const h2 = (h1 + 35 + ((n >>> 9) % 90)) % 360;
    const angle = 115 + ((n >>> 17) % 110);
    return `--h1:${h1};--h2:${h2};--ang:${angle}deg`;
  };

  /** Azərbaycan əlifbası ilə sıralama (brauzerlərin "az" sıralaması həmişə dəqiq olmur). */
  const AZ_ALPHABET = 'abcçdeəfgğhxıijkqlmnoöprsştuüvyz';
  function compareAz(a, b) {
    const x = normalize(a);
    const y = normalize(b);
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      if (x[i] === y[i]) continue;
      const ix = AZ_ALPHABET.indexOf(x[i]);
      const iy = AZ_ALPHABET.indexOf(y[i]);
      if (ix !== -1 && iy !== -1) return ix - iy;
      return x[i].localeCompare(y[i], LOCALE);
    }
    return x.length - y.length;
  }

  const filmWord = (n) => `${n} film`;
  const isClassic = (film) => film.year !== null && film.year < CLASSIC_BEFORE;

  /** "1940-cı illər", "1950-ci illər", "2010-cu illər"... */
  function decadeLabel(decade) {
    const tens = Math.floor(decade / 10) % 10;
    let suffix;
    if (tens === 0) suffix = Math.floor(decade / 100) % 10 === 0 ? 'ci' : 'cü'; // 2000-ci, 1900-cü
    else suffix = { 1: 'cu', 2: 'ci', 3: 'cu', 4: 'cı', 5: 'ci', 6: 'cı', 7: 'ci', 8: 'ci', 9: 'cı' }[tens];
    return `${decade}-${suffix} illər`;
  }

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
    .sort(compareAz);
  const years = films.map((f) => f.year).filter((y) => y !== null);
  const decades = [...new Set(years.map((y) => Math.floor(y / 10) * 10))].sort((a, b) => a - b);
  const topRank = new Map(films.slice(0, TOP_COUNT).map((f, i) => [f.id, i + 1]));

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

    if (!saved) toast('Siyahı bu brauzerdə yadda saxlanıla bilmədi.', 'muted');
    else if (adding) toast(`“${film.title}” siyahıya əlavə edildi`);
    else toast(`“${film.title}” siyahıdan çıxarıldı`, 'muted');
  }

  /* ---------- Filtr vəziyyəti ---------- */
  const state = { query: '', genre: '', decade: decades[0] ?? null };

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
    hero: $('#top'),
    heroSlides: $('#heroSlides'),
    heroDots: $('#heroDots'),
    genreChips: $('#genreChips'),
    rows: $('#rows'),
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
  /** Poster olmadıqda: id-dən yaranan tünd qradiyent, fonda böyük il, böyük ad. Rəsmi poster deyil. */
  function createFallback(film) {
    return h('div', { class: 'poster__fallback', style: paletteOf(film), 'aria-hidden': 'true' },
      film.year ? h('span', { class: 'poster__year', text: String(film.year) }) : null,
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

  function metaChips(film, { long = false } = {}) {
    return [
      film.year ? h('span', { class: 'chip chip--red', text: long ? `İl: ${film.year}` : String(film.year) }) : null,
      film.genre ? h('span', { class: 'chip', text: long ? `Janr: ${film.genre}` : film.genre }) : null,
      isClassic(film) ? h('span', { class: 'chip chip--classic', text: 'Klassik' }) : null
    ].filter(Boolean);
  }

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
  function createCard(film, { rank = null } = {}) {
    const listBtn = h('button', { type: 'button', class: 'card__list', 'data-list-id': film.id });
    listBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleList(film.id, listBtn);
    });
    paintListButton(listBtn, film);

    const poster = createPoster(film);
    poster.append(
      h('div', { class: 'card__panel', 'aria-hidden': 'true' },
        film.description ? h('p', { class: 'card__panel-desc', text: film.description }) : null,
        h('span', { class: 'card__panel-more' }, 'Ətraflı ', h('span', { svg: ICONS.arrow }))
      )
    );

    const openBtn = h('button', { type: 'button', class: 'card__open' },
      h('div', { class: 'card__media' }, poster),
      h('div', { class: 'card__info' },
        h('h3', { class: 'card__title' },
          rank ? h('span', { class: 'visually-hidden', text: `Yer ${rank}: ` }) : null,
          film.title),
        h('p', { class: 'card__meta', text: metaText(film) })
      )
    );
    openBtn.addEventListener('click', () => openModal(film.id, openBtn));

    // Siyahı düyməsi açma düyməsinin içində deyil, yanında durur (düymə içində düymə olmasın).
    const inner = h('div', { class: 'card__inner' }, openBtn, listBtn);
    return h('li', { class: rank ? 'card card--ranked' : 'card', 'data-id': film.id },
      rank ? h('span', { class: 'card__rank', 'aria-hidden': 'true', text: String(rank) }) : null,
      inner
    );
  }

  /* ---------- Bölmələr ---------- */
  const sectionDefs = [
    {
      key: 'top',
      id: 'top10',
      title: 'Top 10',
      note: 'films.js-dəki ilk 10 film',
      ranked: true,
      source: () => films.slice(0, TOP_COUNT),
      emptyAll: () => ({ title: 'Hələ film əlavə edilməyib', text: 'Filmləri films.js faylına əlavə etdikdən sonra onlar burada görünəcək.' })
    },
    {
      key: 'all',
      id: 'kino',
      title: 'Azərbaycan kinosu',
      source: () => films,
      emptyAll: () => ({ title: 'Hələ film əlavə edilməyib', text: 'Filmləri films.js faylına əlavə etdikdən sonra onlar burada görünəcək.' })
    },
    {
      key: 'mylist',
      id: 'siyahim',
      title: 'Siyahım',
      note: 'Siyahı yalnız bu brauzerdə saxlanılır.',
      noteIcon: true,
      // ən son əlavə edilən birinci
      source: () => myList.slice().reverse().map((id) => filmById.get(id)).filter(Boolean),
      emptyAll: () => ({
        title: 'Siyahınız hələ boşdur',
        text: 'Film əlavə etmək üçün kartın küncündəki “+” düyməsinə və ya filmin pəncərəsindəki “Siyahıma əlavə et” düyməsinə basın. Əlavə etdiyiniz filmlər burada toplanacaq.'
      })
    },
    {
      key: 'classics',
      id: 'klassikler',
      title: 'Klassiklər',
      note: `${CLASSIC_BEFORE}-ci ilə qədər çəkilmiş filmlər`,
      source: () => films.filter(isClassic),
      emptyAll: () => ({ title: 'Bu bölmədə hələ film yoxdur', text: `${CLASSIC_BEFORE}-ci ildən əvvəl çəkilmiş filmlər avtomatik olaraq burada görünür.` })
    },
    { key: 'stats' },
    ...genres.map((g, i) => ({
      key: `genre:${g}`,
      id: `janr-${i + 1}`,
      title: g,
      kicker: 'Janr',
      hideWhenFiltered: true, // filtrdən sonra boş qalan janr sırası gizlənir
      source: () => films.filter((f) => f.genre === g),
      emptyAll: () => ({ title: 'Film yoxdur' })
    })),
    {
      key: 'decades',
      id: 'onilliklar',
      title: 'Onilliklər üzrə',
      decades: true,
      source: () => films.filter((f) => f.year !== null && Math.floor(f.year / 10) * 10 === state.decade),
      emptyAll: () => ({ title: 'İl məlumatı olan film yoxdur', text: 'films.js-də year sahəsi yazılmış filmlər burada onilliklərə görə qruplaşdırılır.' })
    }
  ];

  const sections = [];
  const sectionByKey = {};

  function buildRowSection(def) {
    const titleId = `${def.id}-title`;
    const el = h('section', { class: 'row-section', id: def.id, 'aria-labelledby': titleId });
    const count = h('span', { class: 'row-count' });
    const head = h('div', { class: 'row-head' },
      def.kicker ? h('span', { class: 'row-kicker', text: def.kicker }) : null,
      h('h2', { class: 'row-title', id: titleId, text: def.title }),
      count,
      def.note ? h('p', { class: 'row-note' }, def.noteIcon ? h('span', { svg: ICONS.infoSmall }) : null, def.note) : null
    );
    el.append(head);

    let decadeBar = null;
    if (def.decades) {
      decadeBar = h('div', { class: 'chips chips--decades', role: 'group', 'aria-label': 'Onillik seçin' });
      el.append(decadeBar);
    }

    const prev = h('button', { type: 'button', class: 'row__arrow row__arrow--prev', 'aria-label': `${def.title}: əvvəlki filmlər`, svg: arrowSvg(-1) });
    const next = h('button', { type: 'button', class: 'row__arrow row__arrow--next', 'aria-label': `${def.title}: növbəti filmlər`, svg: arrowSvg(1) });
    const track = h('ul', { class: def.ranked ? 'track track--ranked' : 'track' });
    const row = h('div', { class: 'row' }, prev, track, next);
    const empty = h('div', { class: 'row-empty', hidden: true });
    el.append(row, empty);

    const sec = { ...def, el, row, track, empty, count, prev, next, decadeBar };
    [prev, next].forEach((btn, i) => {
      btn.addEventListener('click', () => {
        track.scrollBy({ left: (i ? 1 : -1) * track.clientWidth * 0.85, behavior: reducedMotion() ? 'auto' : 'smooth' });
      });
    });
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateArrows(sec));
    }, { passive: true });
    return sec;
  }

  function buildStats() {
    const oldest = years.length ? Math.min(...years) : null;
    const newest = years.length ? Math.max(...years) : null;
    const items = [
      { value: films.length, label: 'film' },
      { value: genres.length, label: 'janr' },
      { value: oldest, label: 'ən köhnə filmin ili' },
      { value: newest, label: 'ən yeni filmin ili' }
    ];
    const el = h('section', { class: 'stats', id: 'reqemler', 'aria-labelledby': 'statsTitle' },
      h('div', { class: 'stats__head' },
        h('h2', { class: 'stats__title', id: 'statsTitle' }, 'Azərbaycan kinosu ', h('span', { text: 'rəqəmlərdə' })),
        h('p', { class: 'stats__note', text: 'Rəqəmlər films.js-dəki məlumatdan hesablanır.' })
      ),
      h('ul', { class: 'stats__grid' },
        items.map((item, i) => h('li', { class: 'stat', style: `--i:${i}` },
          h('span', { class: 'stat__value', 'data-count-to': item.value ?? '', text: item.value == null ? '—' : '0' }),
          h('span', { class: 'stat__label', text: item.label })
        ))
      )
    );
    return { key: 'stats', el, isStats: true };
  }

  sectionDefs.forEach((def) => {
    const sec = def.key === 'stats' ? buildStats() : buildRowSection(def);
    sections.push(sec);
    sectionByKey[sec.key.startsWith('genre:') ? sec.key : sec.key] = sec;
    els.rows.append(sec.el);
  });
  const rowSections = sections.filter((s) => !s.isStats);

  function renderEmpty(sec, { title, text, reset }) {
    sec.empty.replaceChildren(...[
      h('strong', { text: title }),
      text ? h('p', { text }) : null,
      reset ? h('button', { type: 'button', class: 'btn btn--primary', 'data-reset': '', onclick: resetFilters }, 'Filtrləri sıfırla') : null
    ].filter(Boolean));
  }

  function renderDecadeBar(sec) {
    if (!sec.decadeBar) return;
    sec.decadeBar.hidden = !decades.length;
    const buttons = decades.map((d) => {
      const n = films.filter((f) => f.year !== null && Math.floor(f.year / 10) * 10 === d && matchesFilters(f)).length;
      const active = d === state.decade;
      return h('button', {
        type: 'button',
        class: active ? 'chip-btn is-active' : 'chip-btn',
        'aria-pressed': String(active),
        'data-decade': d,
        onclick: () => {
          state.decade = d;
          renderSection(sec);
        }
      }, decadeLabel(d), h('span', { class: 'chip-btn__count', text: String(n) }));
    });
    const focusedDecade = document.activeElement?.dataset?.decade;
    sec.decadeBar.replaceChildren(...buttons);
    if (focusedDecade) $(`[data-decade="${focusedDecade}"]`, sec.decadeBar)?.focus({ preventScroll: true });
  }

  function renderSection(sec) {
    if (sec.isStats) return;
    renderDecadeBar(sec);
    const all = sec.source();
    const visible = all.filter(matchesFilters);

    sec.count.textContent = all.length
      ? (filtersActive() ? `${visible.length} / ${all.length}` : filmWord(all.length))
      : '';
    if (sec.decades && state.decade !== null) sec.count.textContent = `${decadeLabel(state.decade)} · ${sec.count.textContent || '0 film'}`;

    if (sec.hideWhenFiltered) sec.el.hidden = !visible.length;

    if (!all.length || !visible.length) {
      sec.row.hidden = true;
      sec.empty.hidden = false;
      renderEmpty(sec, !all.length ? sec.emptyAll() : {
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
    let changed = existing.size !== wanted.size;
    existing.forEach((el, id) => { if (!wanted.has(id)) { el.remove(); changed = true; } });

    visible.forEach((film, index) => {
      let card = existing.get(film.id);
      if (!card) {
        card = createCard(film, { rank: sec.ranked ? topRank.get(film.id) : null });
        card.style.setProperty('--i', String(Math.min(index, 10)));
      }
      const current = sec.track.children[index];
      if (current !== card) sec.track.insertBefore(card, current || null);
    });

    // Siyahı dəyişibsə, sıranı əvvələ qaytar (əks halda birinci kart kəsik görünür).
    if (changed) sec.track.scrollLeft = 0;
    requestAnimationFrame(() => updateArrows(sec));
  }

  function renderAll() {
    rowSections.forEach(renderSection);
    renderChips();
  }

  /* ---------- Üfüqi sıra oxları ---------- */
  function updateArrows(sec) {
    const t = sec.track;
    const max = t.scrollWidth - t.clientWidth;
    sec.prev.disabled = t.scrollLeft <= 4;
    sec.next.disabled = t.scrollLeft >= max - 4;
  }

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => rowSections.forEach(updateArrows));
    rowSections.forEach((s) => ro.observe(s.track));
  }

  /* ---------- Rəqəm sayğacı ---------- */
  function countUp(el) {
    const target = Number(el.dataset.countTo);
    if (!Number.isFinite(target) || el.dataset.countTo === '') return;
    if (reducedMotion()) { el.textContent = String(target); return; }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Scroll ilə görünmə (kartlar stagger, rəqəmlər sayğac) ---------- */
  const statsEl = sectionByKey.stats.el;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if (entry.target === statsEl) $$('[data-count-to]', statsEl).forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    rowSections.forEach((s) => io.observe(s.track));
    io.observe(statsEl);
  } else {
    rowSections.forEach((s) => s.track.classList.add('is-visible'));
    statsEl.classList.add('is-visible');
    $$('[data-count-to]', statsEl).forEach((el) => { if (el.dataset.countTo !== '') el.textContent = el.dataset.countTo; });
  }

  /* ---------- Hero slayder ---------- */
  const featuredFilms = films.filter((f) => f.featured);
  const slides = featuredFilms.length ? featuredFilms : films.slice(0, HERO_FALLBACK_COUNT);
  let slideIndex = 0;
  const slideEls = [];
  const dotEls = [];

  function heroBackground(film) {
    const bg = h('div', { class: 'hero__bg', 'aria-hidden': 'true' });
    if (film.poster) {
      // posterin bulanıq, qaranlıq versiyası
      const img = h('img', { alt: '', decoding: 'async' });
      img.addEventListener('error', () => { img.remove(); bg.classList.add('hero__bg--art'); }, { once: true });
      img.src = film.poster;
      bg.append(img);
    } else {
      bg.classList.add('hero__bg--art');
      bg.setAttribute('style', paletteOf(film));
    }
    return bg;
  }

  function buildSlide(film, i) {
    const moreBtn = h('button', { type: 'button', class: 'btn btn--primary btn--lg' },
      h('span', { svg: ICONS.info }), h('span', { text: 'Ətraflı' }));
    moreBtn.addEventListener('click', () => openModal(film.id, moreBtn));
    const listBtn = h('button', { type: 'button', class: 'btn btn--secondary btn--lg list-toggle', 'data-list-id': film.id });
    listBtn.addEventListener('click', () => toggleList(film.id, listBtn));
    paintListButton(listBtn, film);

    const posterBtn = h('button', { type: 'button', class: 'hero__poster anim', style: '--d:2', tabindex: '-1', 'aria-hidden': 'true' },
      createPoster(film, { eager: i === 0 }));
    posterBtn.addEventListener('click', () => openModal(film.id, moreBtn));

    return h('article', {
      class: 'hero__slide',
      'aria-roledescription': 'slayd',
      'aria-label': `${i + 1} / ${slides.length}: ${film.title}`
    },
      heroBackground(film),
      h('div', { class: 'hero__shade', 'aria-hidden': 'true' }),
      h('div', { class: 'hero__inner' },
        h('div', { class: 'hero__content' },
          h('p', { class: 'hero__eyebrow anim', style: '--d:0' },
            h('span', { class: 'hero__pin', 'aria-hidden': 'true' }),
            film.featured ? 'Seçilmiş film' : 'Kataloqdan'),
          h('h2', { class: 'hero__title anim', style: '--d:1', text: film.title }),
          h('p', { class: 'hero__meta anim', style: '--d:2' }, metaChips(film)),
          film.description ? h('p', { class: 'hero__desc anim', style: '--d:3', text: film.description }) : null,
          h('div', { class: 'hero__actions anim', style: '--d:4' }, moreBtn, listBtn)
        ),
        posterBtn
      )
    );
  }

  function buildHero() {
    if (!slides.length) {
      els.heroSlides.append(h('article', { class: 'hero__slide is-active' },
        h('div', { class: 'hero__bg hero__bg--art', 'aria-hidden': 'true' }),
        h('div', { class: 'hero__shade', 'aria-hidden': 'true' }),
        h('div', { class: 'hero__inner' },
          h('div', { class: 'hero__content' },
            h('h2', { class: 'hero__title anim', style: '--d:0', text: 'Netflix Azərbaycan' }),
            h('p', { class: 'hero__desc anim', style: '--d:1', text: 'Hələ film əlavə edilməyib. Filmləri films.js faylına əlavə edin.' })
          )
        )
      ));
      els.heroDots.hidden = true;
      return;
    }
    slides.forEach((film, i) => {
      const slide = buildSlide(film, i);
      slideEls.push(slide);
      els.heroSlides.append(slide);
    });

    if (slides.length < 2) {
      els.heroDots.hidden = true;
    } else {
      slides.forEach((film, i) => {
        const fill = h('span', { class: 'hero__dot-fill' });
        // nöqtənin doluluq animasiyası bitəndə növbəti slayda keçilir (hover-də animasiya dayanır)
        fill.addEventListener('animationend', (e) => {
          if (e.animationName === 'dotFill' && i === slideIndex && !reducedMotion()) goToSlide(slideIndex + 1);
        });
        const dot = h('button', {
          type: 'button',
          class: 'hero__dot',
          'aria-label': `Slayd ${i + 1}: ${film.title}`,
          onclick: () => goToSlide(i)
        }, fill);
        dotEls.push(dot);
        els.heroDots.append(dot);
      });
    }
    goToSlide(0);
  }

  function goToSlide(i) {
    if (!slideEls.length) return;
    slideIndex = (i + slideEls.length) % slideEls.length;
    slideEls.forEach((el, k) => {
      const active = k === slideIndex;
      el.classList.toggle('is-active', active);
      if (active) el.removeAttribute('inert'); else el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', String(!active));
    });
    dotEls.forEach((dot, k) => {
      const active = k === slideIndex;
      dot.classList.remove('is-active');
      if (active) {
        void dot.offsetWidth; // doluluq animasiyasını yenidən başlat
        dot.classList.add('is-active');
      }
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  // Tab gizlənəndə slayder dayansın
  document.addEventListener('visibilitychange', () => {
    els.hero.classList.toggle('is-paused', document.hidden);
  });

  /* ---------- Janr çipləri ---------- */
  function renderChips() {
    const options = [{ value: '', label: 'Bütün janrlar' }, ...genres.map((g) => ({ value: g, label: g }))];
    const focused = document.activeElement?.closest?.('#genreChips') ? document.activeElement.dataset.genre : null;
    els.genreChips.replaceChildren(...options.map((o) => {
      const active = o.value === state.genre;
      const n = o.value ? films.filter((f) => f.genre === o.value).length : films.length;
      return h('button', {
        type: 'button',
        class: active ? 'chip-btn is-active' : 'chip-btn',
        'aria-pressed': String(active),
        'data-genre': o.value,
        onclick: () => setGenre(o.value)
      }, o.label, h('span', { class: 'chip-btn__count', text: String(n) }));
    }));
    if (focused != null) $(`[data-genre="${CSS.escape(focused)}"]`, els.genreChips)?.focus({ preventScroll: true });
  }

  function setGenre(value) {
    state.genre = value;
    els.genre.value = value;
    renderAll();
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
    els.modalMeta.replaceChildren(...metaChips(film, { long: true }));
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

    // body scroll-unu blokla, arxa fonu əlçatmaz et, slayderi dayandır
    document.body.classList.add('is-locked');
    els.hero.classList.add('is-paused');
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
    els.hero.classList.toggle('is-paused', document.hidden);
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
    if (restoreFocus && els.picker.contains(document.activeElement)) els.pickBtn.focus({ preventScroll: true });
  }

  function pickFilm() {
    clearTimeout(spinTimer);
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
      spinTimer = setTimeout(tick, 55 + Math.pow(step / steps, 2.2) * 260);
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

    const moreBtn = h('button', { type: 'button', class: 'btn btn--primary' },
      h('span', { svg: ICONS.info }), h('span', { text: 'Ətraflı' }));
    moreBtn.addEventListener('click', () => openModal(film.id, moreBtn));

    const againBtn = h('button', { type: 'button', class: 'btn btn--ghost' },
      h('span', { svg: ICONS.dice }), h('span', { text: 'Yenidən seç' }));
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
  els.genre.addEventListener('change', () => setGenre(els.genre.value));

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
  buildHero();
  renderAll();
  refreshListState();
  updateHeader();
})();
