/*
 * Netflix Azərbaycan — film məlumatları
 * --------------------------------------
 * Sayt film məlumatlarını YALNIZ bu fayldan oxuyur.
 *
 * Aşağıdakı 3 yazı sadəcə NÜMUNƏ strukturudur — real film deyil.
 * Onları silib öz real filmlərinizi əlavə edin. Hər film üçün sahələr:
 *
 *   id               — unikal mətn, məs. "film-adi-1969" (təkrarlanmamalıdır)
 *   title            — filmin adı
 *   year             — buraxılış ili (rəqəm). 1991-dən əvvəlki filmlər
 *                      avtomatik olaraq "Klassiklər" bölməsində görünür
 *   genre            — janr. Menyudakı janr siyahısı bu sahədən avtomatik yaranır
 *   description      — qısa təsvir
 *   source           — məlumatın götürüldüyü mənbənin linki (https://...)
 *   poster           — poster şəklinin yolu və ya linki (boş qala bilər — onda
 *                      film adı yazılmış neytral təsvir göstərilir)
 *   trailerYoutubeId — YouTube video ID-si, 11 simvol, məs. linkdəki "v=" hissəsindən
 *                      sonrakı kod (boş qala bilər — onda "Treyleri izlə" görünmür)
 *
 * İstəyə bağlı: hər hansı filmə  featured: true  yazsanız, o film yuxarıdakı
 * böyük blokda (hero) göstəriləcək. Yazmasanız, siyahıdakı ilk film götürülür.
 */
const FILMS = [
  {
    id: "numune-1",
    title: "Nümunə film 1",
    year: 1970,
    genre: "Dram",
    description: "Bu, nümunə yazıdır, real film deyil. Filmin qısa təsvirini buraya yazın.",
    source: "",
    poster: "",
    trailerYoutubeId: ""
  },
  {
    id: "numune-2",
    title: "Nümunə film 2",
    year: 1985,
    genre: "Komediya",
    description: "Bu, nümunə yazıdır, real film deyil. 1991-dən əvvəlki il yazıldığı üçün bu kart \"Klassiklər\" bölməsində də görünür.",
    source: "",
    poster: "",
    trailerYoutubeId: ""
  },
  {
    id: "numune-3",
    title: "Nümunə film 3",
    year: 2010,
    genre: "Dram",
    description: "Bu, nümunə yazıdır, real film deyil. Mənbə linkini source sahəsinə, YouTube ID-sini trailerYoutubeId sahəsinə yazın.",
    source: "",
    poster: "",
    trailerYoutubeId: ""
  }
];
