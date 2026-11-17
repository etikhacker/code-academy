# Netflix Azərbaycan — tədris layihəsi

Azərbaycan filmləri üçün kataloq saytı. Sadə HTML, CSS və JavaScript ilə yazılıb: framework yoxdur, build addımı yoxdur.

> Qeyri-rəsmi tədris layihəsidir, Netflix ilə əlaqəli deyil. Sayt film izləmə xidməti deyil.

## Fayllar

| Fayl | Nə üçündür |
|---|---|
| `index.html` | Səhifənin quruluşu |
| `style.css` | Dizayn, animasiyalar, responsiv qaydalar |
| `app.js` | Bütün funksiyalar: axtarış, janr filtri, modal, siyahı, "Mənə film seç" |
| `films.js` | **Film məlumatları.** Sayt filmləri yalnız buradan oxuyur |

## Necə işə salmaq olar

Sayt ünvanları `#` olmadan işləyir (`/filmler`, `/film/babek-1979`). Bunun üçün server mövcud olmayan bütün ünvanlarda `index.html` faylını verməlidir. Vercel bunu `vercel.json` faylı ilə edir.

Lokalda bu qaydanı dəstəkləyən server (Node.js varsa):

```bash
npx serve -s .
```

Sadə `python3 -m http.server 8000` də işləyir. Sadəcə `/filmler` kimi daxili ünvanı birbaşa açanda və ya yeniləyəndə 404 verir. Ana səhifədən (`http://localhost:8000`) başlayıb keçidlərlə gəzmək problemsizdir.

`index.html` faylını birbaşa brauzerdə açsanız (`file://`), sayt avtomatik köhnə `/filmler` formasına keçir və yenə tam işləyir.

## Film əlavə etmək

`films.js` faylında 48 real Azərbaycan filmi var (32-si 1991-ci ildən əvvəl çəkilib). Hər filmin adı, ili və janrı `source` linkindəki mənbədən (əsasən Vikipediya) yoxlanılıb, təsvirlər öz sözlərimizlə yazılıb. Treylerlər müxtəlif YouTube kanallarındandır: hər biri həmin filmə aid olduğu (ad, il) və 5 dəqiqədən qısa olduğu yoxlanılıb, tam film treyler kimi qoyulmayıb. Şəkillər `posters/` (şaquli poster, ≤600px, WebP) və `backdrops/` (filmdən geniş kadr, WebP) qovluqlarındadır. Eni 1000 px-dən kiçik kadr tam enə dartılmır: arxada onun bulanıq versiyası, ortada orijinal öz ölçüsündə göstərilir.

> **Şəkillərin hüquqi statusu:** posterlərin demək olar hamısı Vikipediyada "ədalətli istifadə" (fair use) statusunda saxlanılan qeyri-azad şəkillərdir, kadrlar isə "Azərbaycanfilm"in rəsmi YouTube önizləmələrindən və treylerlərindən götürülüb. Onlar burada yalnız tədris məqsədilə, filmi tanıtmaq üçün kiçik ölçüdə istifadə olunur. Sayt ictimai yayımlanacaqsa, hüquq sahiblərinin şərtlərini nəzərə alın.

Yeni film əlavə etmək üçün `FILMS` massivinə bu formada obyekt yazın:

```js
{
  id: "unikal-id",            // təkrarlanmamalıdır
  title: "Filmin adı",
  year: 1969,                 // rəqəm; 1991-dən əvvəlki filmlər "Klassiklər"də görünür
  genre: "Komediya",          // janr menyusu bu sahədən avtomatik yaranır
  description: "Qısa təsvir",
  source: "https://...",      // məlumatın mənbəyi
  poster: "",                 // şəklin yolu və ya linki; boş qala bilər
  trailerYoutubeId: "",       // 11 simvolluq YouTube ID; boş qala bilər (treyler modalda oynayır)
  backdrop: "",               // filmdən geniş kadr; boş qala bilər
  backdropPosition: "",       // istəyə bağlı, məs. "center 25%" (standart)
  imageSource: "",            // şəklin götürüldüyü səhifə (və ya linklərin siyahısı)
  watch: { url: "https://www.youtube.com/watch?v=...", label: "Azərbaycanfilm — YouTube" }, // tam film — yalnız xarici link
  inCinemas: false,           // true: "Kinoteatrlarda" nişanı, izləmə linki göstərilmir
  featured: false             // true: ana səhifənin slayderində göstərilir
}
```

> Tam film saytın içində oynamır — `watch` linki yeni tabda Azərbaycanfilm-in rəsmi YouTube kanalını açır. Treyler isə modalda oynaya bilər.

- `poster` boşdursa, kartda film adı yazılmış neytral qradiyent göstərilir (rəsmi poster kimi təqdim edilmir).
- `trailerYoutubeId` yazılıbsa, film pəncərəsində "Treyleri izlə" düyməsi çıxır. Video `youtube-nocookie.com` üzərindən açılır.
- İstəyə bağlı: filmlərə `featured: true` yazsanız, onlar yuxarıdakı slayderdə (hero) göstərilir. Heç birində yazılmayıbsa, ilk 5 film göstərilir.

## Səhifələr (ünvanlar)

| Ünvan | Səhifə |
|---|---|
| `/` | Ana səhifə: slayder → janr çipləri → Redaksiyanın seçimi (Top 10) → Azərbaycan kinosu → Klassiklər → Siyahım |
| `/filmler` | Bütün filmlər, "Azərbaycan kinosu rəqəmlərdə" bloku, sıralama: Ən yeni / Ən köhnə / A–Z |
| `/klassikler` | 1991-ci ildən əvvəl çəkilmiş filmlər |
| `/janrlar`, `/janr/{ad}` | Janr kartları və seçilmiş janrın filmləri |
| `/onillikler` | Onilliklər üzrə zaman xətti |
| `/siyahim` | Siyahım |
| `/profil` | Profil (header-in sağ küncündəki dairəvi avatar) |
| `/film/{id}` | Filmin pəncərəsini açır (paylaşmaq üçün) |

Axtarış və janr filtri bütün səhifələrdə işləyir və səhifələr arasında saxlanılır. Brauzerin geri/irəli düymələri işləyir. Səhifələr arası keçid saytı yenidən yükləmir (History API). Köhnə `#/...` linkləri (məs. `#/filmler`, `#siyahim`) avtomatik yeni ünvana keçirilir. Telefonda (≤768px) naviqasiya aşağıda sabit tab bardır.

## Funksiyalar

Bütün bölmələr `films.js`-dən avtomatik yaranır.

- **Hero slayder:** `featured: true` olan filmlər (yoxdursa, ilk 5 film) hər 7 saniyədən bir fade ilə dəyişir (JS taymer). Altda nöqtə göstəriciləri, sağda sol/sağ oxlar var, telefonda barmaqla sürüşdürmək olar. Slayder yalnız brauzer tabı gizli olanda dayanır. Sağda filmin posteri, fonda isə onun bulanıq versiyası görünür. Başlığın altında il, janr və 1991-dən əvvəlki filmlər üçün "Klassik" etiketi var.
- **Janr çipləri:** hero-nun altındadır, basanda janr filtrini dəyişir (menyudakı janr seçimi ilə sinxrondur).
- **Ana səhifənin sıraları:** Redaksiyanın seçimi (Top 10 — sıra `films.js`-dəki `TOP10` massivindən götürülür, böyük konturlu rəqəmlərlə), Azərbaycan kinosu, Klassiklər, Siyahım. Hər sıranın başlığında "Hamısına bax →" linki var.
- **"Azərbaycan kinosu rəqəmlərdə"** (`/filmler` səhifəsinin yuxarısında): film sayı, janr sayı, ən köhnə və ən yeni filmin ili, 0-dan sayılaraq artır.
- **Axtarış:** adın bir hissəsinə görə işləyir, böyük-kiçik hərfə baxmır və Azərbaycan hərflərini düzgün müqayisə edir (`İ/i`, `I/ı`). Axtarış və janr birlikdə bütün sıralara tətbiq olunur. Filtrdən sonra boş qalan janr sıraları gizlənir.
- **Siyahım:** `localStorage`-da saxlanılır, yəni yalnız bu brauzerdə qalır.
- **Profil (`/profil`):** hesab, giriş, parol və server yoxdur — hər şey yalnız bu brauzerin `localStorage`-ındadır (`netflixAz.profile`, `netflixAz.history`), sayta giriş heç vaxt bloklanmır. Ad (standart "Qonaq", ən çox 24 simvol, boş ola bilməz), 8 hazır avatar (emoji + rəngli dairə), sevimli janr; statistika kartları (Siyahımdakı film sayı, açılan film sayı, Siyahımda ən çox olan janr, Siyahımdakı ən köhnə film), "Son baxdıqlarım" (son açılan 10 film), Siyahımın qısa sırası, "Sənin üçün" (sevimli janrdan Siyahımda olmayan 6 film). Parametrlər: "Animasiyaları azalt", "Son baxdıqlarımı təmizlə", "Siyahımı təmizlə", "Profili sıfırla" — hamısı saytın öz təsdiq pəncərəsi ilə (brauzerin `alert/confirm` pəncərələri istifadə olunmur). Ad "Qonaq" deyilsə, slayderdə "Salam, {ad}!" yazısı görünür. `localStorage` bloklanıbsa (məs. bəzi gizli rejimlər), sayt yenə tam işləyir, sadəcə dəyişikliklər yadda qalmır.
- **İzləmək üçün keçid:** Azərbaycanfilm-in rəsmi YouTube kanalında olan filmlərin kartında ▶ nişanı, pəncərəsində "▶ İzləmək üçün keçid" düyməsi var (yeni tabda açılır).
- **Kinoteatrlarda:** `inCinemas: true` olan filmlərdə qırmızı nişan və "Hazırda yalnız kinoteatrlarda nümayiş olunur" yazısı.
- **"Mənə film seç":** seçilmiş janrdan təsadüfi film seçir, axtarış mətnini nəzərə almır.
- **Poster olmayanda:** film id-sindən yaranan fərqli tünd qradiyent, fonda filmin ili, böyük qalın ad. Bu rəsmi poster kimi təqdim edilmir.
- Animasiyalar yalnız `transform` və `opacity` ilə qurulub. Sistemdə "azaldılmış hərəkət" (`prefers-reduced-motion`) aktivdirsə və ya Profildə "Animasiyaları azalt" açılıbsa, animasiyalar və slayderin avtomatik keçidi söndürülür.

## Yayım

Sayt statikdir (build addımı yoxdur): `main` branch-ına push olunanda Vercel onu avtomatik yayımlayır. `vercel.json` Vercel-ə deyir ki, `/filmler`, `/film/{id}` kimi ünvanlarda `index.html` versin (mövcud fayllar — şəkillər, `style.css` və s. — əvvəlki kimi birbaşa verilir). Başqa statik hostinqdə də eyni qayda lazımdır: Netlify-da `_redirects` faylına `/* /index.html 200`, GitHub Pages-də isə `index.html`-in surəti `404.html` kimi. Sayt domenin kökündə (`/`) yerləşməlidir.
