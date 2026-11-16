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
- İstəyə bağlı: bir filmə `featured: true` yazsanız, o film yuxarıdakı böyük blokda göstərilir. Yazmasanız, ilk film göstərilir.

## Funksiyalar

- Üst menyu: axtarış, janr seçimi, "Mənə film seç", "Siyahım". Səhifəni aşağı sürüşdürəndə menyunun fonu şəffafdan tündə keçir. Telefonda axtarış və janr ayrıca düymə ilə açılır.
- 3 bölmə: **Azərbaycan kinosu** (bütün filmlər), **Klassiklər** (1991-dən əvvəl), **Siyahım**.
- Axtarış adın bir hissəsinə görə işləyir, böyük-kiçik hərfə baxmır və Azərbaycan hərflərini düzgün müqayisə edir (`İ/i`, `I/ı`). Axtarış və janr birlikdə işləyir və hər 3 bölməyə tətbiq olunur.
- Siyahım `localStorage`-da saxlanılır, yəni yalnız bu brauzerdə qalır.
- "Mənə film seç" seçilmiş janrdan təsadüfi film seçir. Axtarış mətnini nəzərə almır.
- Animasiyalar yalnız `transform` və `opacity` ilə qurulub. Sistemdə "azaldılmış hərəkət" (`prefers-reduced-motion`) aktivdirsə, söndürülür.

## GitHub Pages

Repo Settings → Pages bölməsində **Source: Deploy from a branch**, **Branch: `main` / `(root)`** seçin. Bir neçə dəqiqədən sonra sayt `https://<istifadəçi>.github.io/<repo>/` ünvanında açılır.
