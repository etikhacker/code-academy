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

Ən sadə yol `index.html` faylını brauzerdə açmaqdır.

Lokal server ilə açmaq daha yaxşıdır (Python varsa):

```bash
python3 -m http.server 8000
```

Sonra brauzerdə `http://localhost:8000` ünvanını açın.

## Film əlavə etmək

`films.js` faylındakı `FILMS` massivinə obyekt əlavə edin. Hazırda orada 3 **nümunə** yazı var. Onlar real film deyil, silib öz filmlərinizi yazın.

```js
{
  id: "unikal-id",            // təkrarlanmamalıdır
  title: "Filmin adı",
  year: 1969,                 // rəqəm; 1991-dən əvvəlki filmlər "Klassiklər"də görünür
  genre: "Komediya",          // janr menyusu bu sahədən avtomatik yaranır
  description: "Qısa təsvir",
  source: "https://...",      // məlumatın mənbəyi
  poster: "",                 // şəklin yolu və ya linki; boş qala bilər
  trailerYoutubeId: ""        // 11 simvolluq YouTube ID; boş qala bilər
}
```

- `poster` boşdursa, kartda film adı yazılmış neytral qradiyent göstərilir (rəsmi poster kimi təqdim edilmir).
- `trailerYoutubeId` yazılıbsa, film pəncərəsində "Treyleri izlə" düyməsi çıxır. Video `youtube-nocookie.com` üzərindən açılır.
- İstəyə bağlı: filmlərə `featured: true` yazsanız, onlar yuxarıdakı slayderdə (hero) göstərilir. Heç birində yazılmayıbsa, ilk 5 film göstərilir.

## Funksiyalar

Bütün bölmələr `films.js`-dən avtomatik yaranır.

- **Hero slayder:** `featured: true` olan filmlər (yoxdursa, ilk 5 film) hər 7 saniyədən bir fade ilə dəyişir. Altda nöqtə göstəriciləri var. Siçan üzərində olanda, film pəncərəsi açıq olanda və ya tab gizli olanda slayder dayanır. Sağda filmin posteri, fonda isə onun bulanıq versiyası görünür. Başlığın altında il, janr və 1991-dən əvvəlki filmlər üçün "Klassik" etiketi var.
- **Janr çipləri:** hero-nun altındadır, basanda janr filtrini dəyişir (menyudakı janr seçimi ilə sinxrondur).
- **Sıralar:** Top 10 (`films.js`-dəki ilk 10 film, böyük konturlu rəqəmlərlə), Azərbaycan kinosu, Siyahım, Klassiklər, hər janr üçün ayrıca sıra, Onilliklər üzrə (onillik düymələri ilə).
- **"Azərbaycan kinosu rəqəmlərdə":** film sayı, janr sayı, ən köhnə və ən yeni filmin ili. Rəqəmlər ekrana girəndə 0-dan sayılır.
- **Axtarış:** adın bir hissəsinə görə işləyir, böyük-kiçik hərfə baxmır və Azərbaycan hərflərini düzgün müqayisə edir (`İ/i`, `I/ı`). Axtarış və janr birlikdə bütün sıralara tətbiq olunur. Filtrdən sonra boş qalan janr sıraları gizlənir.
- **Siyahım:** `localStorage`-da saxlanılır, yəni yalnız bu brauzerdə qalır.
- **"Mənə film seç":** seçilmiş janrdan təsadüfi film seçir, axtarış mətnini nəzərə almır.
- **Poster olmayanda:** film id-sindən yaranan fərqli tünd qradiyent, fonda filmin ili, böyük qalın ad. Bu rəsmi poster kimi təqdim edilmir.
- Animasiyalar yalnız `transform` və `opacity` ilə qurulub. Sistemdə "azaldılmış hərəkət" (`prefers-reduced-motion`) aktivdirsə, animasiyalar və slayderin avtomatik keçidi söndürülür.

## GitHub Pages

Repo Settings → Pages bölməsində **Source: Deploy from a branch**, **Branch: `main` / `(root)`** seçin. Bir neçə dəqiqədən sonra sayt `https://<istifadəçi>.github.io/<repo>/` ünvanında açılır.
