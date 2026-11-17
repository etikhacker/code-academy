/* =========================================================
   Netflix Azərbaycan — tətbiq məntiqi (vanilla JS)
   Film məlumatları yalnız films.js-dəki FILMS massivindən oxunur.
   Bütün bölmələr (hero, janr sıraları, onilliklər, Top 10, rəqəmlər)
   bu məlumatdan avtomatik yaranır.
   Profil, Siyahım və baxış tarixçəsi yalnız localStorage-da saxlanılır:
   hesab, giriş, parol və server yoxdur.
   ========================================================= */
(() => {
  'use strict';

  const LOCALE = 'az';
  const STORAGE_KEY = 'netflixAz.myList';
  const CLASSIC_BEFORE = 1991;
  const SLIDE_MS = 7000;
  const HERO_FALLBACK_COUNT = 5;
  const MIN_STRETCH_WIDTH = 1000; // bundan dar şəkil tam enə dartılmır
  const DEFAULT_BACKDROP_POSITION = 'center 25%';
  const TOP_COUNT = 10;
  const YT_ID = /^[A-Za-z0-9_-]{11}$/;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // sistem parametri və ya profildəki "Animasiyaları azalt" açarı
  const reducedMotion = () => motionQuery.matches || profile.reduceMotion;

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
      backdrop: String(item.backdrop ?? '').trim(),
      backdropPosition: String(item.backdropPosition ?? '').trim() || DEFAULT_BACKDROP_POSITION,
      // imageSource: bir link və ya linklərin siyahısı (poster və kadr fərqli mənbədəndirsə)
      imageSource: (Array.isArray(item.imageSource) ? item.imageSource : [item.imageSource])
        .map((u) => String(u ?? '').trim()).filter(isHttpUrl),
      trailerYoutubeId: YT_ID.test(trailer) ? trailer : '',
      featured: item.featured === true,
      inCinemas: item.inCinemas === true,
      // tam film yalnız xarici linkdir (yeni tabda); kinoteatrda olan filmə link qoyulmur
      watch: (item.inCinemas !== true && item.watch && isHttpUrl(item.watch.url))
        ? { url: String(item.watch.url), label: String(item.watch.label || 'YouTube') } : null,
      searchKey: normalize(item.title)
    });
  }

  const filmById = new Map(films.map((f) => [f.id, f]));
  const genres = [...new Set(films.map((f) => f.genre).filter(Boolean))]
    .sort(compareAz);
  const years = films.map((f) => f.year).filter((y) => y !== null);
  const decades = [...new Set(years.map((y) => Math.floor(y / 10) * 10))].sort((a, b) => a - b);
  // "Redaksiyanın seçimi": films.js-dəki TOP10 massivi (yoxdursa, ilk 10 film)
  const topList = ((typeof TOP10 !== 'undefined' && Array.isArray(TOP10)) ? TOP10 : [])
    .map(String).map((id) => filmById.get(id)).filter(Boolean).slice(0, TOP_COUNT);
  if (!topList.length) topList.push(...films.slice(0, TOP_COUNT));
  const topRank = new Map(topList.map((f, i) => [f.id, i + 1]));

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
    refreshListPages();

    if (!saved) toast('Siyahı bu brauzerdə yadda saxlanıla bilmədi.', 'muted');
    else if (adding) toast(`“${film.title}” siyahıya əlavə edildi`);
    else toast(`“${film.title}” siyahıdan çıxarıldı`, 'muted');
  }


  /** Siyahımdan asılı səhifələr (Siyahım, Profil) dərhal yenilənsin. */
  function refreshListPages() {
    if (currentPage && (currentPage.key === 'siyahim' || currentPage.key === 'profil')) currentPage.update();
  }

  /* ---------- Profil və baxış tarixçəsi (yalnız localStorage, hesab yoxdur) ---------- */
  const PROFILE_KEY = 'netflixAz.profile';
  const HISTORY_KEY = 'netflixAz.history';
  const HISTORY_MAX = 100;
  const RECENT_COUNT = 10;
  const SHORT_LIST_COUNT = 6;
  const FOR_YOU_COUNT = 6;
  const NAME_MAX = 24;
  const DEFAULT_NAME = 'Qonaq';
  const AVATARS = [
    { icon: '🎬', bg: '#c4101b', label: 'Kino lövhəsi' },
    { icon: '🍿', bg: '#b45309', label: 'Popkorn' },
    { icon: '🎭', bg: '#6d28d9', label: 'Teatr maskaları' },
    { icon: '🎥', bg: '#0369a1', label: 'Kinokamera' },
    { icon: '⭐', bg: '#0f766e', label: 'Ulduz' },
    { icon: '🦁', bg: '#9a3412', label: 'Şir' },
    { icon: '🌙', bg: '#1e3a8a', label: 'Ay' },
    { icon: '🎧', bg: '#15803d', label: 'Qulaqlıq' }
  ];

  // localStorage gizli rejimdə, bloklananda və ya dolu olanda xəta ata bilər — sayt yenə işləməlidir
  const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); return true; } catch { return false; } }
  };
  const parseJson = (raw, fallback) => {
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const defaultProfile = () => ({ name: DEFAULT_NAME, avatar: 0, favGenre: '', reduceMotion: false });
  const cleanName = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const nameLength = (value) => Array.from(value).length; // emoji 1 simvol sayılsın

  function readProfile() {
    const saved = parseJson(safeStorage.get(PROFILE_KEY), null);
    const base = defaultProfile();
    if (!saved || typeof saved !== 'object') return base;
    const name = cleanName(saved.name);
    const avatar = Number(saved.avatar);
    return {
      name: name && nameLength(name) <= NAME_MAX ? name : base.name,
      avatar: Number.isInteger(avatar) && avatar >= 0 && avatar < AVATARS.length ? avatar : base.avatar,
      favGenre: genres.includes(saved.favGenre) ? saved.favGenre : '',
      reduceMotion: saved.reduceMotion === true
    };
  }

  function readHistory() {
    const list = parseJson(safeStorage.get(HISTORY_KEY), []);
    return Array.isArray(list) ? [...new Set(list.map(String))].slice(0, HISTORY_MAX) : [];
  }

  let profile = readProfile();
  let viewHistory = readHistory(); // ən yenisi əvvəldə
  const saveProfile = () => safeStorage.set(PROFILE_KEY, JSON.stringify(profile));
  const saveHistory = () => safeStorage.set(HISTORY_KEY, JSON.stringify(viewHistory));
  const isGuest = () => profile.name === DEFAULT_NAME;

  /** Film pəncərəsi açılanda: filmi tarixçənin əvvəlinə keçir (təkrar olmadan). */
  function recordView(id) {
    viewHistory = [id, ...viewHistory.filter((x) => x !== id)].slice(0, HISTORY_MAX);
    saveHistory();
    if (currentPage && currentPage.key === 'profil') currentPage.update();
  }

  function avatarEl(index, extraClass = '') {
    const a = AVATARS[index] || AVATARS[0];
    return h('span', { class: `avatar${extraClass ? ` ${extraClass}` : ''}`, style: `--av:${a.bg}`, 'aria-hidden': 'true', text: a.icon });
  }

  /** Profil dəyişəndə: header avatarı, hero salamı, animasiya parametri. */
  function applyProfile() {
    document.documentElement.classList.toggle('reduce-motion', profile.reduceMotion);
    const a = AVATARS[profile.avatar] || AVATARS[0];
    const headerAvatar = $('#headerAvatar');
    if (headerAvatar) {
      headerAvatar.textContent = a.icon;
      headerAvatar.style.setProperty('--av', a.bg);
    }
    const link = $('#avatarLink');
    if (link) {
      link.setAttribute('aria-label', `Profil: ${profile.name}`);
      link.title = `Profil: ${profile.name}`;
    }
    $$('[data-hello]').forEach((el) => {
      el.hidden = isGuest();
      el.textContent = isGuest() ? '' : `Salam, ${profile.name}!`;
    });
  }

  /** Rəqəmi əvvəlki qiymətindən yenisinə animasiya ilə dəyişir. */
  function animateNumber(el, to) {
    const from = Number(el.dataset.value || 0);
    el.dataset.value = String(to);
    cancelAnimationFrame(Number(el.dataset.raf || 0));
    if (reducedMotion() || from === to) { el.textContent = String(to); return; }
    const duration = Math.abs(to - from) > 100 ? 1400 : 800;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1) el.dataset.raf = String(requestAnimationFrame(step));
    };
    el.dataset.raf = String(requestAnimationFrame(step));
  }

  /* ---------- Filtr vəziyyəti ---------- */
  const state = { query: '', genre: '', decade: decades[0] ?? null, sort: 'new' };

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
    modalBanner: $('#modalBanner'),
    modalCinema: $('#modalCinema'),
    modalWatch: $('#modalWatch'),
    modalWatchNote: $('#modalWatchNote'),
    modalImageSource: $('#modalImageSource'),
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
      h('span', { class: 'poster__title', text: film.title })
    );
  }

  function createPoster(film, { mini = false, eager = false, defer = false } = {}) {
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
    // defer: src sonra (slayder növbəyə çatanda) veriləcək
    if (defer) img.dataset.src = film.poster; else img.src = film.poster;
    wrap.append(img);
    return wrap;
  }

  const metaText = (film) => [film.year, film.genre].filter(Boolean).join(' · ');

  function metaChips(film, { long = false } = {}) {
    return [
      film.year ? h('span', { class: 'chip chip--red', text: long ? `İl: ${film.year}` : String(film.year) }) : null,
      film.genre ? h('span', { class: 'chip', text: long ? `Janr: ${film.genre}` : film.genre }) : null,
      isClassic(film) ? h('span', { class: 'chip chip--classic', text: 'Klassik' }) : null,
      film.inCinemas ? h('span', { class: 'chip chip--cinema', text: 'Kinoteatrlarda' }) : null
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
    if (film.inCinemas) poster.append(h('span', { class: 'cinema-badge', text: 'Kinoteatrlarda' }));
    else if (film.watch) poster.append(h('span', { class: 'watch-badge', title: 'İzləmək üçün keçid var', 'aria-label': 'İzləmək üçün keçid var', text: '▶' }));
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
      more: '#/filmler',
      id: 'top10',
      title: 'Redaksiyanın seçimi',
      note: 'Top 10',
      ranked: true,
      source: () => topList,
      emptyAll: () => ({ title: 'Hələ film əlavə edilməyib', text: 'Filmləri films.js faylına əlavə etdikdən sonra onlar burada görünəcək.' })
    },
    {
      key: 'all',
      more: '#/filmler',
      id: 'kino',
      title: 'Azərbaycan kinosu',
      source: () => films,
      emptyAll: () => ({ title: 'Hələ film əlavə edilməyib', text: 'Filmləri films.js faylına əlavə etdikdən sonra onlar burada görünəcək.' })
    },
    {
      key: 'classics',
      more: '#/klassikler',
      id: 'klassikler',
      title: 'Klassiklər',
      note: `${CLASSIC_BEFORE}-ci ilə qədər çəkilmiş filmlər`,
      source: () => films.filter(isClassic),
      emptyAll: () => ({ title: 'Bu bölmədə hələ film yoxdur', text: `${CLASSIC_BEFORE}-ci ildən əvvəl çəkilmiş filmlər avtomatik olaraq burada görünür.` })
    },
    {
      key: 'mylist',
      more: '#/siyahim',
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
      def.more ? h('a', { class: 'row-more', href: def.more }, 'Hamısına bax ', h('span', { 'aria-hidden': 'true', text: '→' }),
        h('span', { class: 'visually-hidden', text: `: ${def.title}` })) : null,
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
    const sec = buildRowSection(def);
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
    if (currentPage) currentPage.update();
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

  /* ---------- Scroll ilə görünmə (kartlar stagger) ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    rowSections.forEach((s) => io.observe(s.track));
  } else {
    rowSections.forEach((s) => s.track.classList.add('is-visible'));
  }

  /* ---------- Hero slayder ---------- */
  const featuredFilms = films.filter((f) => f.featured);
  const slides = featuredFilms.length ? featuredFilms : films.slice(0, HERO_FALLBACK_COUNT);
  let slideIndex = 0;
  const slideEls = [];
  const dotEls = [];

  /**
   * Slaydın fonu:
   *  - kadr (backdrop) en azı 1280 px-dirsə → tam ekran kadr;
   *  - kiçikdirsə və ya yoxdursa → posterin güclü bulanıq, qaranlıq "ambient" versiyası;
   *  - heç biri yoxdursa → qradiyent.
   * Şəkil src-i slayd növbəyə yaxınlaşanda verilir (loadSlideImages).
   */
  function heroBackground(film) {
    const bg = h('div', { class: 'hero__bg', 'aria-hidden': 'true' });
    if (!film.backdrop && !film.poster) {
      bg.classList.add('hero__bg--art');
      bg.setAttribute('style', paletteOf(film));
      return bg;
    }
    const img = h('img', { alt: '', decoding: 'async' });
    img.dataset.backdrop = film.backdrop;
    img.dataset.poster = film.poster;
    img.dataset.position = film.backdropPosition;
    bg.append(img);
    return bg;
  }

  function useAmbient(bg, img, src) {
    bg.classList.add('hero__bg--ambient');
    if (img.getAttribute('src') !== src) img.src = src;
    else img.classList.add('is-ready');
  }

  function loadHeroBackground(bg) {
    const img = $('img:not(.img-blur)', bg);
    if (!img || img.dataset.started) return;
    img.dataset.started = '1';
    const { backdrop, poster } = img.dataset;
    if (img.dataset.position) img.style.objectPosition = img.dataset.position;
    img.addEventListener('load', () => {
      // kadr dardırsa, dartılmır: bulanıq fon + mərkəzdə öz ölçüsündə orijinal
      if (img.getAttribute('src') === backdrop) fitNarrowImage(bg, img, 'hero__bg--fit');
      img.classList.add('is-ready');
    });
    img.addEventListener('error', () => {
      if (img.getAttribute('src') === backdrop && poster) { useAmbient(bg, img, poster); return; }
      img.hidden = true;
      bg.classList.remove('hero__bg--ambient');
      bg.classList.add('hero__bg--art');
    });
    // kadr yoxdursa: posterin güclü bulanıq "ambient" fonu
    if (backdrop) img.src = backdrop;
    else useAmbient(bg, img, poster);
  }

  /** Slaydın şəkillərini yükləməyə başla (aktiv və növbəti slayd üçün çağırılır). */
  function loadSlideImages(slide) {
    if (!slide) return;
    const bg = $('.hero__bg', slide);
    if (bg) loadHeroBackground(bg);
    $$('img[data-src]', slide).forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  function buildSlide(film, i) {
    const moreBtn = h('button', { type: 'button', class: 'btn btn--primary btn--lg' },
      h('span', { svg: ICONS.info }), h('span', { text: 'Ətraflı' }));
    moreBtn.addEventListener('click', () => openModal(film.id, moreBtn));
    const listBtn = h('button', { type: 'button', class: 'btn btn--secondary btn--lg list-toggle', 'data-list-id': film.id });
    listBtn.addEventListener('click', () => toggleList(film.id, listBtn));
    paintListButton(listBtn, film);

    const posterBtn = h('button', { type: 'button', class: 'hero__poster anim', style: '--d:2', tabindex: '-1', 'aria-hidden': 'true' },
      createPoster(film, { eager: true, defer: true }));
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
          h('p', { class: 'hero__hello anim', style: '--d:0', 'data-hello': '', hidden: true }),
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
        const dot = h('button', {
          type: 'button',
          class: 'hero__dot',
          'aria-label': `Slayd ${i + 1}: ${film.title}`,
          onclick: () => goToSlide(i)
        }, h('span', { class: 'hero__dot-fill' }));
        dotEls.push(dot);
        els.heroDots.append(dot);
      });
      // sol/sağ oxlar
      const arrow = (dir, label) => h('button', {
        type: 'button',
        class: `hero__arrow hero__arrow--${dir < 0 ? 'prev' : 'next'}`,
        'aria-label': label,
        svg: arrowSvg(dir),
        onclick: () => goToSlide(slideIndex + dir)
      });
      els.hero.append(arrow(-1, 'Əvvəlki film'), arrow(1, 'Növbəti film'));
      enableSwipe();
    }
    goToSlide(0);
  }

  /* Avtomatik keçid: sadə 7 saniyəlik taymer. Nöqtənin dolması yalnız göstəricidir. */
  let slideTimer = 0;
  function scheduleNextSlide() {
    clearTimeout(slideTimer);
    if (slideEls.length < 2 || document.hidden) return;
    slideTimer = setTimeout(() => goToSlide(slideIndex + 1), SLIDE_MS);
  }

  function goToSlide(i) {
    if (!slideEls.length) return;
    slideIndex = (i + slideEls.length) % slideEls.length;
    // aktiv və növbəti slaydın şəkillərini əvvəlcədən yüklə ki, keçiddə boşluq olmasın
    loadSlideImages(slideEls[slideIndex]);
    loadSlideImages(slideEls[(slideIndex + 1) % slideEls.length]);
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
        void dot.offsetWidth; // doluluq göstəricisini yenidən başlat
        dot.classList.add('is-active');
      }
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
    scheduleNextSlide();
  }

  /** Telefonda barmaqla sola/sağa sürüşdürmə. */
  function enableSwipe() {
    let x0 = null;
    let y0 = 0;
    els.heroSlides.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    els.heroSlides.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goToSlide(slideIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  // Yalnız tab gizli olanda slayder dayansın; qayıdanda yenidən 7 saniyə saymağa başlasın
  document.addEventListener('visibilitychange', () => {
    els.hero.classList.toggle('is-paused', document.hidden);
    if (document.hidden) clearTimeout(slideTimer);
    else if (slideEls.length > 1) goToSlide(slideIndex);
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

  function openModal(id, opener, { fromRouter = false } = {}) {
    const film = filmById.get(id);
    if (!film) return;
    clearTimeout(modalCloseTimer);
    modalFilmId = id;
    modalOpener = opener || document.activeElement;

    els.modalPoster.replaceChildren(createPoster(film, { eager: true }));
    renderModalBanner(film);
    if (film.imageSource.length) {
      els.modalImageSource.hidden = false;
      els.modalImageSource.replaceChildren('Şəkil mənbəyi: ', ...film.imageSource.flatMap((url, i) => [
        i ? ', ' : null,
        h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: hostOf(url) })
      ].filter(Boolean)));
    } else {
      els.modalImageSource.hidden = true;
      els.modalImageSource.replaceChildren();
    }
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

    els.modalCinema.hidden = !film.inCinemas;
    if (film.watch) {
      els.modalWatch.href = film.watch.url;
      els.modalWatch.title = film.watch.label;
      els.modalWatch.hidden = false;
      els.modalWatchNote.hidden = false;
    } else {
      els.modalWatch.hidden = true;
      els.modalWatch.removeAttribute('href');
      els.modalWatchNote.hidden = true;
    }
    els.modalList.dataset.listId = film.id;
    paintListButton(els.modalList, film);
    recordView(film.id);

    removeTrailer();
    els.modalTrailer.hidden = !film.trailerYoutubeId;

    // body scroll-unu blokla, arxa fonu əlçatmaz et, slayderi dayandır
    document.body.classList.add('is-locked');
    backgroundEls.forEach((el) => el && el.setAttribute('inert', ''));

    els.modal.hidden = false;
    els.modalDialog.scrollTop = 0;
    void els.modal.offsetWidth; // keçid animasiyası üçün
    els.modal.classList.add('is-open');
    els.modalClose.focus({ preventScroll: true });
    // paylaşmaq üçün ünvan: #/film/{id}; "geri" düyməsi modalı bağlayır
    const filmHash = `#/film/${encodeURIComponent(film.id)}`;
    if (!fromRouter && location.hash !== filmHash) {
      history.pushState({ film: film.id }, '', filmHash);
      pushedFilmState = true;
    }
    document.title = `${film.title}${film.year ? ` (${film.year})` : ''} — ${SITE_NAME}`;
  }

  function closeModal({ fromRouter = false } = {}) {
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

    if (!fromRouter && parseHash(location.hash).name === 'film') {
      if (pushedFilmState) history.back();
      else history.replaceState(null, '', baseHash);
    }
    pushedFilmState = false;
    setDocumentTitle(currentBase);
  }

  /**
   * Dar şəkli (naturalWidth < 1000) dartmamaq üçün: arxada həmin şəklin güclü bulanıq, qaranlıq
   * versiyası, üstündə orijinal öz ölçüsündə, mərkəzdə. Hero və modal banneri üçün ortaqdır.
   */
  function fitNarrowImage(box, img, fitClass) {
    if (img.naturalWidth >= MIN_STRETCH_WIDTH || box.classList.contains(fitClass)) return false;
    box.classList.add(fitClass);
    const blur = h('img', { alt: '', class: 'img-blur', 'aria-hidden': 'true' });
    blur.src = img.currentSrc || img.src;
    box.insertBefore(blur, img);
    img.style.maxWidth = `${img.naturalWidth}px`;
    img.style.maxHeight = `${img.naturalHeight}px`;
    return true;
  }

  const hostOf = (url) => new URL(url).hostname.replace(/^www[.]/, '');

  /** Modalın yuxarısında geniş kadr; yoxdursa posterin bulanıq versiyası, o da yoxdursa qradiyent. */
  function renderModalBanner(film) {
    const banner = els.modalBanner;
    banner.className = 'modal__banner';
    banner.removeAttribute('style');
    const src = film.backdrop || film.poster;
    if (!src) {
      banner.classList.add('modal__banner--art');
      banner.setAttribute('style', paletteOf(film));
      banner.replaceChildren();
      return;
    }
    if (!film.backdrop) banner.classList.add('modal__banner--blur');
    banner.classList.add('is-loading');
    const img = h('img', { alt: '', decoding: 'async', class: 'modal__banner-img' });
    img.style.objectPosition = film.backdropPosition;
    img.addEventListener('load', () => {
      if (film.backdrop) fitNarrowImage(banner, img, 'modal__banner--fit');
      banner.classList.remove('is-loading');
    }, { once: true });
    img.addEventListener('error', () => {
      banner.replaceChildren();
      banner.className = 'modal__banner modal__banner--art';
      banner.setAttribute('style', paletteOf(film));
    }, { once: true });
    img.src = src;
    banner.replaceChildren(img);
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

  /* ---------- Təsdiq pəncərəsi (brauzerin confirm() funksiyası əvəzinə) ---------- */
  const confirmEls = {
    root: $('#confirm'),
    title: $('#confirmTitle'),
    text: $('#confirmText'),
    ok: $('#confirmOk'),
    cancel: $('#confirmCancel')
  };
  let confirmResolve = null;
  let confirmOpener = null;
  const confirmOpen = () => Boolean(confirmResolve);

  function askConfirm({ title, text, okLabel = 'Təsdiqlə' }) {
    if (confirmResolve) finishConfirm(false);
    confirmOpener = document.activeElement;
    confirmEls.title.textContent = title;
    confirmEls.text.textContent = text;
    confirmEls.ok.textContent = okLabel;
    document.body.classList.add('is-locked');
    backgroundEls.forEach((el) => el && el.setAttribute('inert', ''));
    confirmEls.root.hidden = false;
    void confirmEls.root.offsetWidth;
    confirmEls.root.classList.add('is-open');
    confirmEls.cancel.focus({ preventScroll: true }); // təhlükəsiz seçim əvvəlcədən fokusda
    return new Promise((resolve) => { confirmResolve = resolve; });
  }

  function finishConfirm(ok) {
    if (!confirmResolve) return;
    const resolve = confirmResolve;
    confirmResolve = null;
    confirmEls.root.classList.remove('is-open');
    confirmEls.root.hidden = true;
    if (els.modal.hidden) {
      document.body.classList.remove('is-locked');
      backgroundEls.forEach((el) => el && el.removeAttribute('inert'));
    }
    const opener = confirmOpener;
    confirmOpener = null;
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    resolve(ok);
  }

  confirmEls.ok.addEventListener('click', () => finishConfirm(true));
  confirmEls.cancel.addEventListener('click', () => finishConfirm(false));
  $('[data-confirm-cancel]').addEventListener('click', () => finishConfirm(false));
  confirmEls.root.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault(); // iki düymə arasında qalsın
    (document.activeElement === confirmEls.ok ? confirmEls.cancel : confirmEls.ok).focus();
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
  // Profil səhifəsində film siyahısı yoxdur — axtarış/janr Filmlər səhifəsində göstərilir
  const leaveProfileForResults = () => {
    if (currentBase && currentBase.name === 'profil') location.hash = '#/filmler';
  };
  els.search.addEventListener('input', () => {
    leaveProfileForResults();
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
    leaveProfileForResults();
    setGenre(els.genre.value);
  });

  function resetFilters() {
    clearTimeout(searchTimer);
    state.query = '';
    state.genre = '';
    els.search.value = '';
    els.genre.value = '';
    renderAll();
    els.search.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1359.98px)').matches) setFiltersOpen(true);
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
    if (confirmOpen()) {
      e.preventDefault();
      finishConfirm(false);
    } else if (!els.modal.hidden && els.modal.classList.contains('is-open')) {
      e.preventDefault();
      closeModal();
    } else if (!els.picker.hidden) {
      closePicker();
    }
  });

  /* ---------- Başqa tabda dəyişiklik ---------- */
  window.addEventListener('storage', (e) => {
    const all = e.key === null; // localStorage.clear()
    if (all || e.key === STORAGE_KEY) {
      myList = store.read();
      refreshListState();
      renderSection(sectionByKey.mylist);
    }
    if (all || e.key === PROFILE_KEY) { profile = readProfile(); applyProfile(); }
    if (all || e.key === HISTORY_KEY) viewHistory = readHistory();
    if (all || [STORAGE_KEY, PROFILE_KEY, HISTORY_KEY].includes(e.key)) {
      if (currentPage) currentPage.update();
    }
  });


  /* =========================================================
     Səhifələr və hash routing
     #/ · #/filmler · #/klassikler · #/janrlar · #/janr/{ad} · #/onillikler · #/siyahim · #/profil · #/film/{id}
     ========================================================= */
  const SITE_NAME = 'Netflix Azərbaycan';
  const PAGE_TITLES = {
    home: 'Ana səhifə', filmler: 'Filmlər', klassikler: 'Klassiklər', janrlar: 'Janrlar',
    onillikler: 'Onilliklər', siyahim: 'Siyahım', profil: 'Profil', notfound: 'Səhifə tapılmadı'
  };
  const viewHome = $('#viewHome');
  const viewPage = $('#viewPage');
  let currentBase = null;   // hazırda göstərilən səhifə (film modalı onun üstündə açılır)
  let baseHash = '#/';
  let currentPage = null;   // { key, update }
  let pushedFilmState = false;
  const LEGACY = { siyahim: '#/siyahim', kino: '#/filmler', klassikler: '#/klassikler', top: '#/', top10: '#/', onilliklar: '#/onillikler' };

  function parseHash(hash) {
    const raw = String(hash || '').replace(/^#/, '');
    if (!raw || raw === '/') return { name: 'home' };
    if (!raw.startsWith('/')) return { name: 'legacy', anchor: raw };
    let parts;
    try { parts = raw.slice(1).split('/').filter(Boolean).map(decodeURIComponent); } catch { return { name: 'notfound' }; }
    const [a, b] = parts;
    if (parts.length === 1 && ['filmler', 'klassikler', 'janrlar', 'onillikler', 'siyahim', 'profil'].includes(a)) return { name: a };
    if (parts.length === 2 && a === 'janr') return { name: 'janr', genre: b };
    if (parts.length === 2 && a === 'film') return { name: 'film', id: b };
    if (parts.length === 0) return { name: 'home' };
    return { name: 'notfound' };
  }

  const routeKey = (r) => (r.name === 'janr' ? `janr/${r.genre}` : r.name);

  function setDocumentTitle(r) {
    if (!r || r.name === 'home') { document.title = `${SITE_NAME} — Azərbaycan filmləri`; return; }
    const t = r.name === 'janr' ? `${r.genre} — Janrlar` : PAGE_TITLES[r.name] || PAGE_TITLES.notfound;
    document.title = `${t} — ${SITE_NAME}`;
  }

  function markActiveNav(r) {
    const active = r.name === 'janr' ? 'janrlar' : r.name;
    $$('.mainnav__link').forEach((a) => {
      const on = a.dataset.route === active;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const avatarLink = $('#avatarLink');
    if (avatarLink) {
      avatarLink.classList.toggle('is-active', r.name === 'profil');
      if (r.name === 'profil') avatarLink.setAttribute('aria-current', 'page'); else avatarLink.removeAttribute('aria-current');
    }
  }

  /* --- ümumi hissələr --- */
  function pageHead(title, { kicker, note, controls } = {}) {
    const count = h('span', { class: 'page__count' });
    const head = h('header', { class: 'page__head' },
      h('div', { class: 'page__titles' },
        kicker ? h('p', { class: 'page__kicker', text: kicker }) : null,
        h('h1', { class: 'page__title', id: 'pageTitle', text: title }),
        count,
        note ? h('p', { class: 'page__note', text: note }) : null),
      controls || null);
    return { head, count };
  }

  function emptyBox({ title, text, reset = false, link = null }) {
    return h('div', { class: 'row-empty page__empty' },
      h('strong', { text: title }),
      text ? h('p', { text }) : null,
      reset ? h('button', { type: 'button', class: 'btn btn--primary', 'data-reset': '', onclick: resetFilters }, 'Filtrləri sıfırla') : null,
      link ? h('a', { class: 'btn btn--primary', href: link.href, text: link.text }) : null);
  }

  /** Kartları grid-ə yerləşdirir; mövcud kartları təkrar istifadə edir (fokus itməsin). */
  function fillGrid(grid, list) {
    const existing = new Map($$(':scope > .card', grid).map((el) => [el.dataset.id, el]));
    const wanted = new Set(list.map((f) => f.id));
    existing.forEach((el, id) => { if (!wanted.has(id)) el.remove(); });
    list.forEach((film, i) => {
      let card = existing.get(film.id);
      if (!card) {
        card = createCard(film);
        card.style.setProperty('--i', String(Math.min(i, 12)));
      }
      const cur = grid.children[i];
      if (cur !== card) grid.insertBefore(card, cur || null);
    });
  }

  const countLabel = (shown, all) => (filtersActive() && shown !== all ? `${shown} / ${all} film` : filmWord(all));

  /** Grid səhifəsi: Filmlər, Klassiklər, Siyahım, bir janr. */
  function gridPage({ key, title, kicker, note, source, sortable = false, emptyAll, stats = false }) {
    let controls = null;
    if (sortable) {
      const sel = h('select', { id: 'sortSelect', 'aria-label': 'Sıralama' },
        h('option', { value: 'new', text: 'Ən yeni' }), h('option', { value: 'old', text: 'Ən köhnə' }), h('option', { value: 'az', text: 'A–Z' }));
      sel.value = state.sort;
      sel.addEventListener('change', () => { state.sort = sel.value; currentPage.update(); });
      controls = h('label', { class: 'field page__sort' }, h('span', { class: 'page__sortlabel', text: 'Sıralama' }), sel);
    }
    const { head, count } = pageHead(title, { kicker, note, controls });
    const grid = h('ul', { class: 'grid', 'aria-labelledby': 'pageTitle' });
    const empty = h('div', { hidden: true });
    const statsBlock = stats ? buildStats().el : null;
    viewPage.replaceChildren(...[head, statsBlock, grid, empty].filter(Boolean));
    if (statsBlock) {
      statsBlock.classList.add('is-visible');
      $$('[data-count-to]', statsBlock).forEach(countUp);
    }
    return {
      key,
      update() {
        const all = source();
        let list = all.filter(matchesFilters);
        if (sortable) {
          const by = { new: (a, b) => (b.year ?? 0) - (a.year ?? 0), old: (a, b) => (a.year ?? 9999) - (b.year ?? 9999), az: (a, b) => compareAz(a.title, b.title) }[state.sort];
          list = list.slice().sort(by);
        }
        count.textContent = all.length ? countLabel(list.length, all.length) : '';
        fillGrid(grid, list);
        grid.hidden = !list.length;
        empty.hidden = !!list.length;
        if (!list.length) {
          empty.replaceChildren(all.length
            ? emptyBox({ title: 'Uyğun film tapılmadı', text: 'Axtarış sözünü və ya janrı dəyişin, yaxud filtrləri sıfırlayın.', reset: true })
            : emptyBox(emptyAll()));
        }
      }
    };
  }

  function genresPage() {
    const { head, count } = pageHead('Janrlar', { note: 'Janrı seçin — həmin janrın bütün filmləri açılacaq.' });
    const grid = h('ul', { class: 'genre-grid' });
    viewPage.replaceChildren(head, grid);
    return {
      key: 'janrlar',
      update() {
        count.textContent = `${genres.length} janr`;
        grid.replaceChildren(...genres.map((g) => {
          const inGenre = films.filter((f) => f.genre === g);
          const shown = inGenre.filter((f) => !state.query || f.searchKey.includes(state.query)).length;
          const cover = inGenre.find((f) => f.backdrop) || inGenre.find((f) => f.poster);
          const img = cover ? h('img', { src: cover.backdrop || cover.poster, alt: '', loading: 'lazy', decoding: 'async' }) : null;
          return h('li', {},
            h('a', { class: `genre-card${state.genre === g ? ' is-active' : ''}`, href: `#/janr/${encodeURIComponent(g)}`, style: paletteOf({ id: g }) },
              img,
              h('span', { class: 'genre-card__name', text: g }),
              h('span', { class: 'genre-card__count', text: state.query ? `${shown} / ${inGenre.length} film` : filmWord(inGenre.length) })));
        }));
      }
    };
  }

  function decadesPage() {
    const { head, count } = pageHead('Onilliklər', { note: 'Azərbaycan kinosunun zaman xətti — onillik-onillik.' });
    const line = h('ol', { class: 'timeline' });
    const empty = h('div', { hidden: true });
    viewPage.replaceChildren(head, line, empty);
    return {
      key: 'onillikler',
      update() {
        let total = 0;
        const items = decades.map((d) => {
          const list = films.filter((f) => f.year !== null && Math.floor(f.year / 10) * 10 === d && matchesFilters(f))
            .sort((a, b) => a.year - b.year);
          total += list.length;
          if (!list.length) return null;
          const row = h('ul', { class: 'track is-visible timeline__row' });
          fillGrid(row, list);
          return h('li', { class: 'timeline__item', id: `onillik-${d}` },
            h('div', { class: 'timeline__marker', 'aria-hidden': 'true' }, h('span', { text: String(d) })),
            h('div', { class: 'timeline__body' },
              h('h2', { class: 'timeline__title' }, decadeLabel(d), h('span', { class: 'row-count', text: filmWord(list.length) })),
              row));
        }).filter(Boolean);
        line.replaceChildren(...items);
        count.textContent = `${decades.length} onillik · ${filmWord(total)}`;
        empty.hidden = !!total;
        empty.replaceChildren(...(total ? [] : [emptyBox({ title: 'Uyğun film tapılmadı', text: 'Axtarış sözünü və ya janrı dəyişin, yaxud filtrləri sıfırlayın.', reset: true })]));
      }
    };
  }

  function notFoundPage() {
    viewPage.replaceChildren(h('section', { class: 'notfound' },
      h('p', { class: 'notfound__code', text: '404' }),
      h('h1', { class: 'page__title', id: 'pageTitle', text: 'Səhifə tapılmadı' }),
      h('p', { text: 'Axtardığınız səhifə mövcud deyil və ya köçürülüb.' }),
      h('a', { class: 'btn btn--primary btn--lg', href: '#/', text: 'Ana səhifəyə qayıt' })));
    return { key: 'notfound', update() {} };
  }

  /* --- Profil səhifəsi (#/profil) --- */
  function profileSection({ id, title, more = null, note = null }) {
    const count = h('span', { class: 'row-count' });
    const noteEl = note ? h('p', { class: 'row-note' }) : null;
    const list = h('ul', { class: 'grid profile__list', 'aria-labelledby': `${id}-title` });
    const empty = h('div', { class: 'row-empty', hidden: true });
    const el = h('section', { class: 'profile__section', id, 'aria-labelledby': `${id}-title` },
      h('div', { class: 'row-head' },
        h('h2', { class: 'row-title', id: `${id}-title`, text: title }),
        count,
        more ? h('a', { class: 'row-more', href: more }, 'Hamısına bax ', h('span', { 'aria-hidden': 'true', text: '→' }),
          h('span', { class: 'visually-hidden', text: `: ${title}` })) : null,
        noteEl),
      list, empty);
    return {
      el, count, note: noteEl,
      show(items, emptyContent) {
        count.textContent = items.length ? filmWord(items.length) : '';
        fillGrid(list, items);
        list.hidden = !items.length;
        empty.hidden = !!items.length;
        empty.replaceChildren(...(items.length ? [] : emptyContent));
      }
    };
  }

  function settingRow({ title, text, control, id }) {
    return h('li', { class: 'setting' },
      h('div', { class: 'setting__text' },
        h('p', { class: 'setting__title', id: `${id}-label`, text: title }),
        text ? h('p', { class: 'setting__note', id: `${id}-note`, text }) : null),
      control);
  }

  function profilePage() {
    const { head } = pageHead('Profil', { note: 'Profil yalnız bu brauzerdə saxlanılır. Hesab və sinxronlaşma yoxdur.' });

    /* 1. Ad və avatar */
    const bigAvatar = h('span', { class: 'profile__avatar' });
    const nameEl = h('h2', { class: 'profile__name', id: 'profileName' });
    const editBtn = h('button', { type: 'button', class: 'btn btn--ghost', 'aria-controls': 'nameForm', 'aria-expanded': 'false' },
      h('span', { svg: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' }),
      h('span', { text: 'Redaktə et' }));
    const input = h('input', {
      id: 'nameInput', type: 'text', maxlength: String(NAME_MAX), autocomplete: 'nickname',
      spellcheck: 'false', enterkeyhint: 'done', 'aria-describedby': 'nameCounter nameError'
    });
    const counter = h('span', { class: 'profile__counter', id: 'nameCounter' });
    const error = h('p', { class: 'profile__error', id: 'nameError', 'aria-live': 'assertive' });
    const cancelBtn = h('button', { type: 'button', class: 'btn btn--secondary' }, 'Ləğv et');
    const form = h('form', { class: 'profile__form', id: 'nameForm', hidden: true, novalidate: true },
      h('label', { class: 'profile__label', for: 'nameInput', text: `Adınız (ən çox ${NAME_MAX} simvol)` }),
      h('div', { class: 'profile__formrow' },
        h('span', { class: 'profile__inputwrap' }, input, counter),
        h('button', { type: 'submit', class: 'btn btn--primary' }, 'Yadda saxla'),
        cancelBtn),
      error);

    const updateCounter = () => { counter.textContent = `${nameLength(input.value)}/${NAME_MAX}`; };
    const setError = (msg) => {
      error.textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    };
    function openEdit() {
      form.hidden = false;
      editBtn.hidden = true;
      editBtn.setAttribute('aria-expanded', 'true');
      input.value = profile.name;
      setError('');
      updateCounter();
      input.focus();
      input.select();
    }
    function closeEdit() {
      form.hidden = true;
      editBtn.hidden = false;
      editBtn.setAttribute('aria-expanded', 'false');
      setError('');
      editBtn.focus({ preventScroll: true });
    }
    editBtn.addEventListener('click', openEdit);
    cancelBtn.addEventListener('click', closeEdit);
    input.addEventListener('input', () => { updateCounter(); if (error.textContent) setError(''); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeEdit(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = cleanName(input.value);
      if (!name) { setError('Ad boş ola bilməz.'); input.focus(); return; }
      if (nameLength(name) > NAME_MAX) { setError(`Ad ən çox ${NAME_MAX} simvol ola bilər.`); input.focus(); return; }
      profile.name = name;
      persistProfile('Ad yadda saxlanıldı');
      closeEdit();
    });

    const avatarGroup = h('div', { class: 'avatar-choices', role: 'group', 'aria-labelledby': 'avatarTitle' },
      AVATARS.map((a, i) => h('button', {
        type: 'button', class: 'avatar-choice', 'data-avatar': String(i), 'aria-label': a.label, title: a.label,
        onclick: () => {
          if (profile.avatar === i) return;
          profile.avatar = i;
          persistProfile('Avatar dəyişdirildi');
        }
      }, avatarEl(i))));

    const genreSel = h('select', { id: 'favGenre', 'aria-describedby': 'favGenreNote' },
      h('option', { value: '', text: 'Seçilməyib' }),
      genres.map((g) => h('option', { value: g, text: g })));
    genreSel.addEventListener('change', () => {
      profile.favGenre = genreSel.value;
      persistProfile(genreSel.value ? `Sevimli janr: ${genreSel.value}` : 'Sevimli janr silindi');
    });

    const identity = h('section', { class: 'profile__card', 'aria-labelledby': 'profileName' },
      h('div', { class: 'profile__who' },
        bigAvatar,
        h('div', { class: 'profile__whotext' },
          h('p', { class: 'profile__kicker', text: 'Bu brauzerin profili' }),
          nameEl,
          editBtn,
          form)),
      h('div', { class: 'profile__prefs' },
        h('div', { class: 'profile__pref' },
          h('p', { class: 'profile__label', id: 'avatarTitle', text: 'Avatar' }),
          avatarGroup),
        h('div', { class: 'profile__pref' },
          h('label', { class: 'profile__label', for: 'favGenre', text: 'Sevimli janr' }),
          h('span', { class: 'field page__sort profile__genre' }, genreSel),
          h('p', { class: 'profile__hint', id: 'favGenreNote', text: 'Seçsəniz, aşağıda “Sənin üçün” bölməsi görünəcək.' }))));

    /* 2. Statistika */
    const statDefs = [
      { key: 'list', label: 'Siyahımdakı film sayı' },
      { key: 'seen', label: 'Baxılan (açılan) film sayı' },
      { key: 'genre', label: 'Siyahımda ən çox olan janr' },
      { key: 'oldest', label: 'Siyahımdakı ən köhnə film' }
    ];
    const statEls = {};
    const statsEl = h('section', { class: 'stats profile__stats is-visible', 'aria-labelledby': 'profileStatsTitle' },
      h('div', { class: 'stats__head' },
        h('h2', { class: 'stats__title', id: 'profileStatsTitle' }, 'Sənin ', h('span', { text: 'statistikan' }))),
      h('ul', { class: 'stats__grid' },
        statDefs.map((d, i) => {
          const value = h('span', { class: `stat__value${d.key === 'genre' ? ' stat__value--text' : ''}`, 'data-stat': d.key, text: d.key === 'genre' ? '—' : '0' });
          const sub = h('span', { class: 'stat__sub' });
          statEls[d.key] = { value, sub };
          return h('li', { class: 'stat', style: `--i:${i}` }, value, h('span', { class: 'stat__label', text: d.label }), sub);
        })));

    /* 3. Bölmələr */
    const recent = profileSection({ id: 'son-baxdiqlarim', title: 'Son baxdıqlarım' });
    const shortList = profileSection({ id: 'profil-siyahim', title: 'Siyahım', more: '#/siyahim' });
    const forYou = profileSection({ id: 'senin-ucun', title: 'Sənin üçün', note: true });

    /* 4. Parametrlər */
    const motionSwitch = h('button', {
      type: 'button', class: 'switch', role: 'switch', id: 'motionSwitch',
      'aria-labelledby': 'motion-label', 'aria-describedby': 'motion-note'
    }, h('span', { class: 'switch__thumb', 'aria-hidden': 'true' }));
    motionSwitch.addEventListener('click', () => {
      profile.reduceMotion = !profile.reduceMotion;
      persistProfile(profile.reduceMotion ? 'Animasiyalar azaldıldı' : 'Animasiyalar bərpa olundu');
    });
    const settingsTitle = h('h2', { class: 'row-title', id: 'settingsTitle', tabindex: '-1', text: 'Parametrlər' });
    const clearHistoryBtn = h('button', { type: 'button', class: 'btn btn--secondary', 'aria-describedby': 'clear-history-note' }, 'Son baxdıqlarımı təmizlə');
    const clearListBtn = h('button', { type: 'button', class: 'btn btn--secondary', 'aria-describedby': 'clear-list-note' }, 'Siyahımı təmizlə');
    const resetBtn = h('button', { type: 'button', class: 'btn btn--danger', 'aria-describedby': 'reset-note' }, 'Profili sıfırla');
    // əməliyyatdan sonra düymə söndürülürsə, fokus itməsin
    const keepFocus = (btn) => { if (btn.disabled) settingsTitle.focus({ preventScroll: true }); };

    clearHistoryBtn.addEventListener('click', async () => {
      const ok = await askConfirm({
        title: 'Son baxdıqlarım təmizlənsin?',
        text: 'Açdığınız filmlərin siyahısı bu brauzerdən silinəcək. Siyahım və profil dəyişməyəcək.',
        okLabel: 'Təmizlə'
      });
      if (!ok) return;
      viewHistory = [];
      const saved = safeStorage.remove(HISTORY_KEY);
      page.update();
      keepFocus(clearHistoryBtn);
      toast(saved ? 'Son baxdıqlarım təmizləndi' : 'Bu brauzerdə yaddaş əlçatan deyil.', 'muted');
    });
    clearListBtn.addEventListener('click', async () => {
      const n = myList.filter((id) => filmById.has(id)).length;
      const ok = await askConfirm({
        title: 'Siyahım təmizlənsin?',
        text: `Siyahımdakı ${filmWord(n)} silinəcək. Bunu geri qaytarmaq olmaz.`,
        okLabel: 'Siyahımı təmizlə'
      });
      if (!ok) return;
      myList = [];
      const saved = store.write(myList);
      refreshListState();
      renderSection(sectionByKey.mylist);
      page.update();
      keepFocus(clearListBtn);
      toast(saved ? 'Siyahım təmizləndi' : 'Bu brauzerdə yaddaş əlçatan deyil.', 'muted');
    });
    resetBtn.addEventListener('click', async () => {
      const ok = await askConfirm({
        title: 'Profil sıfırlansın?',
        text: 'Ad, avatar, sevimli janr və “Animasiyaları azalt” parametri ilkin vəziyyətə qayıdacaq. Siyahım və son baxdıqlarım silinmir.',
        okLabel: 'Sıfırla'
      });
      if (!ok) return;
      profile = defaultProfile();
      safeStorage.remove(PROFILE_KEY);
      if (!form.hidden) { form.hidden = true; editBtn.hidden = false; editBtn.setAttribute('aria-expanded', 'false'); }
      applyProfile();
      page.update();
      keepFocus(resetBtn);
      toast('Profil sıfırlandı', 'muted');
    });

    const settings = h('section', { class: 'profile__section profile__settings', 'aria-labelledby': 'settingsTitle' },
      h('div', { class: 'row-head' }, settingsTitle),
      h('ul', { class: 'settings' },
        settingRow({ id: 'motion', title: 'Animasiyaları azalt', control: motionSwitch,
          text: 'Slayd keçidləri, kartların görünməsi və sayğaclar animasiyasız olacaq.' }),
        settingRow({ id: 'clear-history', title: 'Son baxdıqlarım', control: clearHistoryBtn,
          text: 'Açdığınız filmlərin tarixçəsini silir.' }),
        settingRow({ id: 'clear-list', title: 'Siyahım', control: clearListBtn,
          text: 'Siyahımdakı bütün filmləri çıxarır.' }),
        settingRow({ id: 'reset', title: 'Profil', control: resetBtn,
          text: 'Ad, avatar, sevimli janr və parametrləri ilkin vəziyyətə qaytarır.' })));

    viewPage.replaceChildren(head, identity, statsEl, recent.el, shortList.el, forYou.el, settings);

    function persistProfile(message) {
      const saved = saveProfile();
      applyProfile();
      page.update();
      toast(saved ? message : 'Profil bu brauzerdə yadda saxlanıla bilmədi.', saved ? '' : 'muted');
    }

    const page = {
      key: 'profil',
      update() {
        const a = AVATARS[profile.avatar] || AVATARS[0];
        bigAvatar.replaceChildren(avatarEl(profile.avatar, 'avatar--lg'));
        nameEl.textContent = profile.name;
        $$('.avatar-choice', avatarGroup).forEach((b) => {
          const on = Number(b.dataset.avatar) === profile.avatar;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        bigAvatar.title = a.label;
        genreSel.value = profile.favGenre;
        motionSwitch.setAttribute('aria-checked', String(profile.reduceMotion));

        const listFilms = myList.slice().reverse().map((id) => filmById.get(id)).filter(Boolean);
        const seenFilms = viewHistory.map((id) => filmById.get(id)).filter(Boolean);

        // statistika
        animateNumber(statEls.list.value, listFilms.length);
        statEls.list.sub.textContent = listFilms.length ? '' : 'Siyahı boşdur';
        animateNumber(statEls.seen.value, seenFilms.length);
        statEls.seen.sub.textContent = seenFilms.length ? `Sonuncu: ${seenFilms[0].title}` : 'Hələ film açılmayıb';

        const byGenre = new Map();
        listFilms.forEach((f) => { if (f.genre) byGenre.set(f.genre, (byGenre.get(f.genre) || 0) + 1); });
        const topGenre = [...byGenre].sort((x, y) => y[1] - x[1] || compareAz(x[0], y[0]))[0];
        statEls.genre.value.textContent = topGenre ? topGenre[0] : '—';
        statEls.genre.sub.textContent = topGenre ? `${filmWord(topGenre[1])} Siyahımda` : 'Siyahı boşdur';

        const oldest = listFilms.filter((f) => f.year !== null).sort((x, y) => x.year - y.year)[0];
        if (oldest) {
          animateNumber(statEls.oldest.value, oldest.year);
          statEls.oldest.sub.textContent = oldest.title;
        } else {
          statEls.oldest.value.dataset.value = '0';
          statEls.oldest.value.textContent = '—';
          statEls.oldest.sub.textContent = 'Siyahı boşdur';
        }

        // bölmələr
        recent.show(seenFilms.slice(0, RECENT_COUNT), [
          h('strong', { text: 'Hələ heç bir filmə baxmamısınız.' }),
          h('p', { text: 'Film kartına basın — açdığınız filmlər burada görünəcək.' }),
          h('a', { class: 'btn btn--primary', href: '#/filmler', text: 'Filmlərə bax' })]);
        shortList.show(listFilms.slice(0, SHORT_LIST_COUNT), [
          h('strong', { text: 'Siyahınız hələ boşdur' }),
          h('p', { text: 'Filmin kartındakı “+” düyməsinə basın — film burada görünəcək.' })]);
        shortList.count.textContent = listFilms.length ? filmWord(listFilms.length) : '';

        forYou.el.hidden = !profile.favGenre;
        if (profile.favGenre) {
          forYou.note.textContent = `Sevimli janrınız: ${profile.favGenre} — Siyahımda olmayan filmlər`;
          forYou.show(films.filter((f) => f.genre === profile.favGenre && !isInList(f.id)).slice(0, FOR_YOU_COUNT), [
            h('strong', { text: 'Bu janrın bütün filmləri artıq Siyahımdadır.' }),
            h('p', { text: 'Başqa sevimli janr seçə bilərsiniz.' })]);
        }

        clearHistoryBtn.disabled = !viewHistory.length;
        clearListBtn.disabled = !myList.length;
      }
    };
    return page;
  }

  function buildPage(r) {
    switch (r.name) {
      case 'filmler':
        return gridPage({ key: 'filmler', title: 'Filmlər', source: () => films, sortable: true, stats: true,
          emptyAll: () => ({ title: 'Hələ film əlavə edilməyib' }) });
      case 'klassikler':
        return gridPage({ key: 'klassikler', title: 'Klassiklər', note: `${CLASSIC_BEFORE}-ci ilə qədər çəkilmiş filmlər`,
          source: () => films.filter(isClassic), emptyAll: () => ({ title: 'Bu bölmədə hələ film yoxdur' }) });
      case 'siyahim':
        return gridPage({ key: 'siyahim', title: 'Siyahım', note: 'Siyahı yalnız bu brauzerdə saxlanılır.',
          source: () => myList.slice().reverse().map((id) => filmById.get(id)).filter(Boolean),
          emptyAll: () => ({
            title: 'Siyahınız hələ boşdur',
            text: 'Bəyəndiyiniz filmin kartındakı “+” düyməsinə və ya filmin pəncərəsindəki “Siyahıma əlavə et” düyməsinə basın — film burada görünəcək.',
            link: { href: '#/filmler', text: 'Filmlərə bax' }
          }) });
      case 'janr':
        return gridPage({ key: `janr/${r.genre}`, title: r.genre, kicker: 'Janr',
          source: () => films.filter((f) => f.genre === r.genre), emptyAll: () => ({ title: 'Bu janrda film yoxdur' }) });
      case 'janrlar': return genresPage();
      case 'onillikler': return decadesPage();
      case 'profil': return profilePage();
      default: return notFoundPage();
    }
  }

  function showBase(r) {
    const key = routeKey(r);
    if (currentBase && routeKey(currentBase) === key) return; // eyni səhifə — yenidən çəkmə
    const first = !currentBase;
    currentBase = r;
    baseHash = r.name === 'home' ? '#/' : `#/${r.name === 'janr' ? `janr/${encodeURIComponent(r.genre)}` : r.name}`;
    const isHome = r.name === 'home';
    viewHome.hidden = !isHome;
    viewPage.hidden = isHome;
    currentPage = isHome ? null : buildPage(r);
    if (currentPage) currentPage.update();
    const view = isHome ? viewHome : viewPage;
    if (!first && !reducedMotion()) {
      view.classList.remove('view-enter');
      void view.offsetWidth;
      view.classList.add('view-enter');
    }
    // slayder yalnız ana səhifədə işləsin
    if (isHome) scheduleNextSlide(); else clearTimeout(slideTimer);
    markActiveNav(r);
    setDocumentTitle(r);
    if (!first) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function route() {
    const r = parseHash(location.hash);
    if (r.name === 'legacy') {
      const target = LEGACY[r.anchor];
      if (target) { history.replaceState(null, '', target); route(); }
      return; // səhifədaxili lövbər (məs. #main) — marşrut deyil
    }
    if (r.name === 'janr' && !genres.includes(r.genre)) { showBase({ name: 'notfound' }); return; }
    if (r.name === 'film') {
      if (!filmById.has(r.id)) { closeModal({ fromRouter: true }); showBase({ name: 'notfound' }); return; }
      if (!currentBase) showBase({ name: 'home' });
      if (modalFilmId !== r.id) openModal(r.id, null, { fromRouter: true });
      return;
    }
    if (!els.modal.hidden && els.modal.classList.contains('is-open')) closeModal({ fromRouter: true });
    pushedFilmState = false;
    showBase(r);
  }

  window.addEventListener('hashchange', route);
  // "Məzmuna keç" linki hash-i dəyişmədən fokusu əsas hissəyə köçürür
  $('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    $('#main').focus();
  });

  /* ---------- Başlanğıc ---------- */
  populateGenres();
  buildHero();
  applyProfile();
  renderAll();
  refreshListState();
  updateHeader();
  route();
})();
