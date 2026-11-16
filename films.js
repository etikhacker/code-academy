/*
 * Netflix Azərbaycan — film məlumatları
 * --------------------------------------
 * Sayt film məlumatlarını YALNIZ bu fayldan oxuyur.
 *
 * Mənbələr: hər filmin title / year / genre məlumatı "source" linkindəki
 * Vikipediya məqaləsindən yoxlanılıb. Təsvirlər (description) həmin mənbələrdəki
 * faktlar əsasında öz sözlərimizlə yazılıb.
 *
 * genre: hər film üçün mənbənin infobox-unda göstərilən janrlardan biri seçilib.
 *        Janr adları vahid yazılır: Dram, Musiqili komediya, Tarixi, Müharibə, Macəra.
 *
 * trailerYoutubeId: yalnız rəsmi kanallarda ("Azərbaycanfilm" kinostudiyası, filmin
 *        istehsalçısı) yerləşən qısa treyler/fraqment. Tam film linki qoyulmayıb.
 *
 * poster:   posters/{id}.jpg — şaquli poster (~600px en). Boş ola bilər.
 * backdrop: backdrops/{id}.webp — filmdən geniş kadr. En azı 1280 px olanlar hero-da tam ekran,
 *           kiçiklər yalnız modal bannerində göstərilir (hero-da posterin bulanıq fonu). Boş ola bilər.
 * imageSource: şəklin götürüldüyü səhifənin linki; poster və kadr fərqli mənbədəndirsə, linklərin siyahısı.
 *
 * Sahələr:
 *   id, title, year, genre, description, source, poster, trailerYoutubeId, backdrop, imageSource
 *   featured: true — film yuxarıdakı slayderdə (hero) göstərilir (istəyə bağlı)
 *   inCinemas: true — film hazırda yalnız kinoteatrlarda nümayiş olunur ("Kinoteatrlarda" nişanı)
 */
const FILMS = [
  {
    id: "44-2026",
    title: "44",
    year: 2026,
    genre: "Müharibə",
    description: "Film 44 günlük Vətən müharibəsini bir hərbi kursantın gözü ilə, xüsusi təyinatlı zabit Rəşad Xəlilovun, Azərbaycanda çalışan türk ortoped həkim Zeynep Özdemirin və polkovnik Ramazan Kərimovun taleyi üzərindən anladır. Premyerası 2026-cı ilin oktyabrında Heydər Əliyev Mərkəzində keçirilən film oktyabrın 15-dən Azərbaycan kinoteatrlarında nümayiş olunur.",
    source: "https://www.trend.az/azerbaijan/society/4212020.html",
    poster: "posters/44-2026.webp",
    trailerYoutubeId: "OLI8WhqONQA",
    backdrop: "backdrops/44-2026.webp",
    imageSource: ["https://www.trend.az/azerbaijan/society/4212020.html", "https://www.youtube.com/watch?v=OLI8WhqONQA"],
    featured: true,
    inCinemas: true
  },
  {
    id: "arsin-mal-alan-1945",
    title: "Arşın mal alan",
    year: 1945,
    genre: "Musiqili komediya",
    description: "Gənc tacir Əsgər evlənmək istəyir, amma gələcək həyat yoldaşını toydan əvvəl görüb tanımaq arzusundadır. Bunun üçün o, arşınmalçı qiyafəsinə girib məhəllələri gəzir və Gülçöhrə ilə tanış olur.",
    source: "https://az.wikipedia.org/wiki/Ar%C5%9F%C4%B1n_mal_alan_(film,_1945)",
    poster: "posters/arsin-mal-alan-1945.jpg",
    trailerYoutubeId: "zSmQEsFFY8M",
    backdrop: "backdrops/arsin-mal-alan-1945.webp",
    imageSource: ["https://en.wikipedia.org/wiki/File:The_Cloth_Peddler_(1945_film).jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"],
    featured: true
  },
  {
    id: "gorus-1955",
    title: "Görüş",
    year: 1955,
    genre: "Dram",
    description: "Film bir-biri ilə yarışan azərbaycanlı və özbək pambıqçılarının dostluğundan danışır. Tənbəl və qayğısız Kamil qabaqcıl pambıqçı Lalaya vurulur və bu sevgi onu zəhmətkeş insana çevirir.",
    source: "https://az.wikipedia.org/wiki/G%C3%B6r%C3%BC%C5%9F_(film,_1955)",
    poster: "posters/gorus-1955.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/gorus-1955.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%92%D1%81%D1%82%D1%80%D0%B5%D1%87%D0%B01955.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "o-olmasin-bu-olsun-1956",
    title: "O olmasın, bu olsun",
    year: 1956,
    genre: "Musiqili komediya",
    description: "Hadisələr 1910-cu ildə Bakıda baş verir: gənc Sərvər və Gülnazın sevgisi pul, cəhalət və köhnə adətlərlə üz-üzə gəlir. Üzeyir Hacıbəyovun eyniadlı operettası əsasında çəkilən filmdə tacirlər, qoçular və alverçilər gülüş hədəfinə çevrilir.",
    source: "https://az.wikipedia.org/wiki/O_olmas%C4%B1n,_bu_olsun_(film)",
    poster: "posters/o-olmasin-bu-olsun-1956.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/o-olmasin-bu-olsun-1956.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9D%D0%B5_%D1%82%D0%B0,_%D1%82%D0%B0%D0%BA_%D1%8D%D1%82%D0%B0_(%D1%84%D0%B8%D0%BB%D1%8C%D0%BC).jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "bir-mehelleden-iki-nefer-1957",
    title: "Bir məhəllədən iki nəfər",
    year: 1957,
    genre: "Dram",
    description: "Film adı çəkilməyən bir Şərq ölkəsində sülh və müstəqillik uğrunda mübarizə aparan sadə insanların taleyindən bəhs edir. Filmin musiqisinə görə bəstəkar Qara Qarayev 1957-ci ildə Ümumittifaq kinofestivalında mükafat alıb.",
    source: "https://az.wikipedia.org/wiki/Bir_m%C9%99h%C9%99ll%C9%99d%C9%99n_iki_n%C9%99f%C9%99r",
    poster: "posters/bir-mehelleden-iki-nefer-1957.jpg",
    trailerYoutubeId: "",
    backdrop: "",
    imageSource: "https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%94%D0%B2%D0%BE%D0%B5_%D0%B8%D0%B7_%D0%BE%D0%B4%D0%BD%D0%BE%D0%B3%D0%BE_%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B0%D0%BB%D0%B0.jpg"
  },
  {
    id: "uzaq-sahillerde-1958",
    title: "Uzaq sahillərdə",
    year: 1958,
    genre: "Müharibə",
    description: "Film İkinci Dünya müharibəsində İtaliya və Yuqoslaviyada faşistlərə qarşı vuruşan Sovet İttifaqı Qəhrəmanı Mehdi Hüseynzadəyə həsr olunub. \"Mixaylo\" ləqəbli partizan alman zabiti qiyafəsində düşmən arxasında cəsarətli əməliyyatlar keçirir.",
    source: "https://az.wikipedia.org/wiki/Uzaq_sahill%C9%99rd%C9%99",
    poster: "posters/uzaq-sahillerde-1958.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/uzaq-sahillerde-1958.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9D%D0%B0_%D0%B4%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D1%85_%D0%B1%D0%B5%D1%80%D0%B5%D0%B3%D0%B0%D1%85.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"],
    featured: true
  },
  {
    id: "ogey-ana-1958",
    title: "Ögey ana",
    year: 1958,
    genre: "Dram",
    description: "Həkim Dilara ailə qurduğu kənddə ögey oğlu balaca İsmayılın sevgisini qazanmağa çalışır. Uşaq onu ana kimi qəbul etmək istəmir, lakin birlikdə keçdikləri çətin sınaq onları bir-birinə yaxınlaşdırır.",
    source: "https://az.wikipedia.org/wiki/%C3%96gey_ana_(film,_1958)",
    poster: "posters/ogey-ana-1958.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/ogey-ana-1958.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9C%D0%B0%D1%87%D0%B5%D1%85%D0%B0_1958_poster.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "koroglu-1960",
    title: "Koroğlu",
    year: 1960,
    genre: "Tarixi",
    description: "Film eyniadlı xalq dastanı əsasında əfsanəvi qəhrəman Koroğlunun hekayəsini ekrana gətirir. Burada xalqın yadelli işğalçılara və yerli zülmkarlara qarşı mübarizəsi göstərilir.",
    source: "https://az.wikipedia.org/wiki/Koro%C4%9Flu_(film,_1960)",
    poster: "posters/koroglu-1960.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/koroglu-1960.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9A%D1%91%D1%80-%D0%BE%D0%B3%D0%BB%D1%8B_(%D0%BF%D0%BE%D1%81%D1%82%D0%B5%D1%80).jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "ehmed-haradadir-1963",
    title: "Əhməd haradadır?",
    year: 1963,
    genre: "Musiqili komediya",
    description: "Valideynlərinin onu xəbəri olmadan evləndirmək qərarına qəzəblənən Əhməd evdən çıxıb gedir. Yolda eyni taleyi yaşayan və oxumaq üçün şəhərə gələn Leyla ilə təsadüfən rastlaşır və gənclər bir-birini sevir.",
    source: "https://az.wikipedia.org/wiki/%C6%8Fhm%C9%99d_haradad%C4%B1r%3F",
    poster: "posters/ehmed-haradadir-1963.jpg",
    trailerYoutubeId: "dd5uk5pJ8Z8",
    backdrop: "backdrops/ehmed-haradadir-1963.webp",
    imageSource: "https://www.youtube.com/watch?v=dd5uk5pJ8Z8"
  },
  {
    id: "ulduz-1964",
    title: "Ulduz",
    year: 1964,
    genre: "Musiqili komediya",
    description: "Kinokomediya iki gəncin təmiz sevgisini və kənddə elmə arxa çevirən vəzifəpərəstlərə qarşı mübarizəni gülüşlə anladır. Film bəstəkar Süleyman Ələsgərovun eyniadlı operettasının motivləri əsasında çəkilib.",
    source: "https://az.wikipedia.org/wiki/Ulduz_(film,_1964)",
    poster: "posters/ulduz-1964.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/ulduz-1964.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9B%D1%8E%D0%B1%D0%BE%D0%B2%D1%8C_%D0%B8_%D0%BB%D0%B8%D0%BC%D0%B0%D0%BD%D0%B4%D1%80%D1%8B.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "bizim-cebis-muellim-1969",
    title: "Bizim Cəbiş müəllim",
    year: 1969,
    genre: "Dram",
    description: "Hadisələr İkinci Dünya müharibəsi illərində Bakıda cərəyan edir və mərkəzdə məktəb müəllimi Cəbiş dayanır. Film ağır dövrdə ailəsini halal zəhmətlə dolandıran sadə insanların mənəvi gücündən bəhs edir.",
    source: "https://az.wikipedia.org/wiki/Bizim_C%C9%99bi%C5%9F_m%C3%BC%C9%99llim",
    poster: "posters/bizim-cebis-muellim-1969.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/bizim-cebis-muellim-1969.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%AF_%D0%BF%D0%BE%D0%BC%D0%BD%D1%8E_%D1%82%D0%B5%D0%B1%D1%8F,_%D1%83%D1%87%D0%B8%D1%82%D0%B5%D0%BB%D1%8C.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "yeddi-ogul-isterem-1970",
    title: "Yeddi oğul istərəm",
    year: 1970,
    genre: "Dram",
    description: "Film 1920-ci illərdə inandıqları ideya uğrunda canından keçməyə hazır olan gənc komsomolçular haqqında romantik hekayədir. Ssenari Səməd Vurğunun \"Komsomol poeması\"nın motivləri əsasında yazılıb.",
    source: "https://az.wikipedia.org/wiki/Yeddi_o%C4%9Ful_ist%C9%99r%C9%99m%E2%80%A6",
    poster: "posters/yeddi-ogul-isterem-1970.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/yeddi-ogul-isterem-1970.webp",
    imageSource: ["https://az.wikipedia.org/wiki/Fayl:Yeddi_o%C4%9Ful_ist%C9%99r%C9%99m..._(film,_1970).jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "axirinci-asirim-1971",
    title: "Axırıncı aşırım",
    year: 1971,
    genre: "Macəra",
    description: "Hadisələr sovet hakimiyyətinin ilk illərində Azərbaycanın dağ kəndlərinin birində baş verir. Taxılının əlindən alınmasına etiraz edən Kərbəlayı İsmayılla yeni kolxoz sədri İman arasındakı qarşıdurma filmin əsas xəttidir.",
    source: "https://az.wikipedia.org/wiki/Ax%C4%B1r%C4%B1nc%C4%B1_a%C5%9F%C4%B1r%C4%B1m",
    poster: "posters/axirinci-asirim-1971.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/axirinci-asirim-1971.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9F%D0%BE%D1%81%D0%BB%D0%B5%D0%B4%D0%BD%D0%B8%D0%B9_%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%B0%D0%BB_%D0%BF%D0%BE%D1%81%D1%82%D0%B5%D1%80.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "nesimi-1973",
    title: "Nəsimi",
    year: 1973,
    genre: "Tarixi",
    description: "Film böyük Azərbaycan şairi və filosofu İmadəddin Nəsiminin həyatından bəhs edir və onun anadan olmasının 600 illiyinə həsr olunub. Baş rolu ifa edən Rasim Balayev üçün bu, kinoda ilk böyük iş olub.",
    source: "https://az.wikipedia.org/wiki/N%C9%99simi_(film)",
    poster: "posters/nesimi-1973.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/nesimi-1973.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9D%D0%B0%D1%81%D0%B8%D0%BC%D0%B8.JPG", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "qatir-memmed-1974",
    title: "Qatır Məmməd",
    year: 1974,
    genre: "Tarixi",
    description: "Film 1919–1920-ci illərdə Gəncə quberniyasında baş vermiş kəndli hərəkatından və onun xalq arasında məşhur başçısı Qatır Məmməddən bəhs edir. Bu, rejissor Rasim Ocaqovun quruluşçu rejissor kimi ilk böyük filmidir.",
    source: "https://az.wikipedia.org/wiki/Qat%C4%B1r_M%C9%99mm%C9%99d_(film)",
    poster: "posters/qatir-memmed-1974.jpg",
    trailerYoutubeId: "1Y9kA5o7-fk",
    backdrop: "backdrops/qatir-memmed-1974.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9C%D1%81%D1%82%D0%B8%D1%82%D0%B5%D0%BB%D1%8C_%D0%B8%D0%B7_%D0%93%D1%8F%D0%BD%D0%B4%D0%B6%D0%B0%D0%B1%D0%B0%D1%81%D0%B0%D1%80%D0%B0.png", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "dede-qorqud-1975",
    title: "Dədə Qorqud",
    year: 1975,
    genre: "Dram",
    description: "İki seriyalı film \"Kitabi-Dədə Qorqud\" oğuz dastanı əsasında çəkilib. Saysız müharibələrin şahidi olan müdrik qoca Dədə Qorqud insanları torpağı qorumağa və onu əkib-becərməyə çağırır.",
    source: "https://en.wikipedia.org/wiki/Dada_Gorgud",
    poster: "posters/dede-qorqud-1975.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/dede-qorqud-1975.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%A1%D0%B2%D0%B5%D1%82_%D0%BF%D0%BE%D0%B3%D0%B0%D1%81%D1%88%D0%B8%D1%85_%D0%BA%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B2.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "dervis-parisi-partladir-1976",
    title: "Dərviş Parisi partladır",
    year: 1976,
    genre: "Musiqili komediya",
    description: "XIX əsrin ortalarında Qarabağda fransız botanik Müsyö Jordan mülkədar Hətəmxan ağanın qardaşı oğlu Şahbaz bəyi oxumaq üçün Parisə aparmaq istəyir. Qohumlar bu səfərin qarşısını almaq üçün hiyləyə əl atır və işə cadugər Dərviş Məstəli şah qarışır.",
    source: "https://az.wikipedia.org/wiki/D%C9%99rvi%C5%9F_Parisi_partlad%C4%B1r",
    poster: "posters/dervis-parisi-partladir-1976.jpg",
    trailerYoutubeId: "Gcwvqt85pI8",
    backdrop: "backdrops/dervis-parisi-partladir-1976.webp",
    imageSource: ["https://en.wikipedia.org/wiki/File:The_Darvish_Detonates_Paris.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "ad-gunu-1977",
    title: "Ad günü",
    year: 1977,
    genre: "Dram",
    description: "Ezamiyyətlə Bakıya gələn müəllim Mustafanın və oğluna ad günü edib uşaqlıq dostlarını bir araya yığmaq istəyən Əlinin hekayələri paralel inkişaf edir. Lirik-psixoloji film əsl dostluq və insanların mənəvi dünyası haqqındadır.",
    source: "https://az.wikipedia.org/wiki/Ad_g%C3%BCn%C3%BC_(film,_1977)",
    poster: "posters/ad-gunu-1977.jpg",
    trailerYoutubeId: "EYlGTRl9aVM",
    backdrop: "backdrops/ad-gunu-1977.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:Den_rozhdeniya.jpg", "https://www.youtube.com/watch?v=EYlGTRl9aVM"]
  },
  {
    id: "qaynana-1978",
    title: "Qaynana",
    year: 1978,
    genre: "Musiqili komediya",
    description: "Gənc bəstəkar Ayazın anası Cənnət xanımla iki gəlini arasında bitməyən dedi-qodular ailədə münaqişələri getdikcə kəskinləşdirir. Məcid Şamxalovun pyesi əsasında çəkilən film köhnə adətlərin zərərini gülüşlə göstərir.",
    source: "https://az.wikipedia.org/wiki/Qaynana_(film)",
    poster: "posters/qaynana-1978.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/qaynana-1978.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%A1%D0%B2%D0%B5%D0%BA%D1%80%D0%BE%D0%B2%D1%8C.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "babek-1979",
    title: "Babək",
    year: 1979,
    genre: "Tarixi",
    description: "Film Abbasilər xilafətinə qarşı iyirmi ildən artıq davam edən üsyanın başçısı Babəkin həyat və mübarizəsindən bəhs edir. \"Mosfilm\" və \"Azərbaycanfilm\"in birgə istehsalı olan bu lent Azərbaycan SSR-in ən bahalı filmi olub.",
    source: "https://az.wikipedia.org/wiki/Bab%C9%99k_(film)",
    poster: "posters/babek-1979.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/babek-1979.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%91%D0%B0%D0%B1%D0%B5%D0%BA.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"],
    featured: true
  },
  {
    id: "beyin-ogurlanmasi-1985",
    title: "Bəyin oğurlanması",
    year: 1985,
    genre: "Musiqili komediya",
    description: "Kəndə toy səhnəsi çəkməyə gələn kino qrupunun rejissoru ssenarinin həyatdan uzaq olduğunu görür və kənddəki əsl toyu lentə almağa başlayır. Film bu iki süjet xəttini birləşdirərək kənd həyatının adət-ənənələrini zarafatla göstərir.",
    source: "https://az.wikipedia.org/wiki/B%C9%99yin_o%C4%9Furlanmas%C4%B1",
    poster: "posters/beyin-ogurlanmasi-1985.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/beyin-ogurlanmasi-1985.webp",
    imageSource: ["https://az.wikipedia.org/wiki/Fayl:B%C9%99yin_o%C4%9Furlanmas%C4%B1_poster.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "feryad-1993",
    title: "Fəryad",
    year: 1993,
    genre: "Müharibə",
    description: "\"Ögey ana\" filmindəki balaca İsmayıl artıq böyüyüb və Qarabağ müharibəsində batalyon komandiridir. Döyüşdə əsir düşən qəhrəmanın hekayəsi real hadisələrə və bir əsgərin yaşadıqlarına əsaslanır.",
    source: "https://az.wikipedia.org/wiki/F%C9%99ryad_(film,_1993)",
    poster: "posters/feryad-1993.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/feryad-1993.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9F%D0%BE%D1%81%D1%82%D0%B5%D1%80_%D1%84%D0%B8%D0%BB%D1%8C%D0%BC%D0%B0_%D0%9A%D1%80%D0%B8%D0%BA.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "yarasa-1995",
    title: "Yarasa",
    year: 1995,
    genre: "Dram",
    description: "1920–1930-cu illərin Bakısında şərq miniatürü üzrə mütəxəssis olan professor gənc qıza vurulur və ailəsini tərk edir. Gözləri tutulandan sonra da kinoteatra getməyə davam edən bu kinomanın hekayəsi kino və tamaşaçı haqqında düşüncəyə çevrilir.",
    source: "https://az.wikipedia.org/wiki/Yarasa_(film,_1995)",
    poster: "posters/yarasa-1995.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/yarasa-1995.webp",
    imageSource: ["https://commons.wikimedia.org/wiki/File:Yarasa,_1995.png", "https://www.youtube.com/@azrbaycandovltfilmfondu3339"]
  },
  {
    id: "sari-gelin-1998",
    title: "Sarı gəlin",
    year: 1998,
    genre: "Müharibə",
    description: "Qarabağ müharibəsinə könüllü gedən ürəyiyumşaq Qədirə erməni əsirini öldürmək əmri verilir. Film müharibədən birlikdə qaçan azərbaycanlı ilə erməninin faciəli taleyindən danışır.",
    source: "https://az.wikipedia.org/wiki/Sar%C4%B1_g%C9%99lin_(film,_1998)",
    poster: "",
    trailerYoutubeId: "",
    backdrop: "backdrops/sari-gelin-1998.webp",
    imageSource: "https://www.youtube.com/@AzerbaijanfilmStudio"
  },
  {
    id: "cavid-omru-2007",
    title: "Cavid ömrü",
    year: 2007,
    genre: "Tarixi",
    description: "Film repressiya qurbanı olan şair Hüseyn Cavidin həyatının son, keşməkeşli illərini canlandırır. Ssenarini yazıçı Anar yazıb, filmdə xronika kadrlarından da istifadə olunub.",
    source: "https://az.wikipedia.org/wiki/Cavid_%C3%B6mr%C3%BC",
    poster: "posters/cavid-omru-2007.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/cavid-omru-2007.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%96%D0%B8%D0%B7%D0%BD%D1%8C_%D0%94%D0%B6%D0%B0%D0%B2%D0%B8%D0%B4%D0%B0.jpg", "https://www.youtube.com/watch?v=vtAhu0AOoLc"]
  },
  {
    id: "40-ci-qapi-2009",
    title: "40-cı qapı",
    year: 2009,
    genre: "Dram",
    description: "Hadisələr 1990-cı illərin əvvəlində Bakı ətrafındakı qəsəbədə baş verir. Atası Rusiyada vəfat edən 14 yaşlı oğlan anasını dolandırmaq üçün təhsilini atıb işləmək məcburiyyətində qalır.",
    source: "https://az.wikipedia.org/wiki/40-c%C4%B1_qap%C4%B1_(film,_2009)",
    poster: "posters/40-ci-qapi-2009.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/40-ci-qapi-2009.webp",
    imageSource: ["https://az.wikipedia.org/wiki/Fayl:40-c%C4%B1_qap%C4%B1_(film,_2008).jpg", "https://www.youtube.com/watch?v=RCBvqoi_AxE"]
  },
  {
    id: "buta-2011",
    title: "Buta",
    year: 2011,
    genre: "Dram",
    description: "Erkən yaşda valideynlərini itirən yeddi yaşlı Buta ucqar dağ kəndində nənəsi ilə yaşayır. Ağıllı və fərqli düşüncəsi üzündən həmyaşıdlarının qısqanclığı və zorakılığı ilə üzləşir.",
    source: "https://az.wikipedia.org/wiki/Buta_(film)",
    poster: "posters/buta-2011.jpg",
    trailerYoutubeId: "NoW553Ft3H0",
    backdrop: "backdrops/buta-2011.webp",
    imageSource: ["https://ru.wikipedia.org/wiki/%D0%A4%D0%B0%D0%B9%D0%BB:%D0%9F%D0%BE%D1%81%D1%82%D0%B5%D1%80_%D1%84%D0%B8%D0%BB%D1%8C%D0%BC%D0%B0_%D0%91%D1%83%D1%82%D0%B0.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "dolu-2012",
    title: "Dolu",
    year: 2012,
    genre: "Müharibə",
    description: "Film Qarabağ müharibəsində Vətən uğrunda son nəfəsədək döyüşən Azərbaycan əsgərlərinin qəhrəmanlığından bəhs edir. Lent Aqil Abbasın eyniadlı romanı əsasında, real hadisələr motivində çəkilib.",
    source: "https://az.wikipedia.org/wiki/Dolu_(film,_2012)",
    poster: "posters/dolu-2012.jpg",
    trailerYoutubeId: "8yDd5-0Xjvk",
    backdrop: "backdrops/dolu-2012.webp",
    imageSource: ["https://az.wikipedia.org/wiki/Fayl:Dolu_(film,_2012).jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"]
  },
  {
    id: "subhun-sefiri-2012",
    title: "Sübhün səfiri",
    year: 2012,
    genre: "Tarixi",
    description: "Film Azərbaycan dramaturgiyasının banisi Mirzə Fətəli Axundzadənin həyatını və irsini anladır. Dramaturqun uşaqlığı, gəncliyi və qocalığı ayrı-ayrı dövrlər kimi canlandırılır.",
    source: "https://az.wikipedia.org/wiki/S%C3%BCbh%C3%BCn_s%C9%99firi",
    poster: "posters/subhun-sefiri-2012.jpg",
    trailerYoutubeId: "pZKnOF7sP2c",
    backdrop: "backdrops/subhun-sefiri-2012.webp",
    imageSource: ["https://az.wikipedia.org/wiki/Fayl:S%C3%BCbh%C3%BCn_s%C9%99firi_(film,_2012).jpg", "https://www.youtube.com/watch?v=pZKnOF7sP2c"]
  },
  {
    id: "colcu-2012",
    title: "Çölçü",
    year: 2012,
    genre: "Dram",
    description: "Ucqar çöldə yaşayan gənc çölçü həyatın incəliklərini atası Uludan öyrənir. Ulunun ölümündən sonra çölə gələn qısa saçlı bir qız onun həyatına yeni səhifə açır.",
    source: "https://az.wikipedia.org/wiki/%C3%87%C3%B6l%C3%A7%C3%BC_(film)",
    poster: "posters/colcu-2012.jpg",
    trailerYoutubeId: "nqGYlDOjCIY",
    backdrop: "backdrops/colcu-2012.webp",
    imageSource: ["https://az.wikipedia.org/wiki/Fayl:%C3%87%C3%B6l%C3%A7%C3%BC_(film,_2012).jpg", "https://www.youtube.com/watch?v=nqGYlDOjCIY"]
  },
  {
    id: "xoca-2012",
    title: "Xoca",
    year: 2012,
    genre: "Müharibə",
    description: "Real faktlar əsasında çəkilən filmdə hadisələr Bakıda və Xocalıda paralel inkişaf edir. Filmin həm rejissoru, həm də ssenari müəllifi Vahid Mustafayevdir.",
    source: "https://az.wikipedia.org/wiki/Xoca_(film,_2012)",
    poster: "posters/xoca-2012.jpg",
    trailerYoutubeId: "",
    backdrop: "",
    imageSource: "https://az.wikipedia.org/wiki/Fayl:Xoca_(film,_2012).jpg"
  },
  {
    id: "nabat-2014",
    title: "Nabat",
    year: 2014,
    genre: "Dram",
    description: "Qarabağ müharibəsi şiddətlənərkən Nabat xəstə əri ilə kənddən uzaq, tənha bir evdə yaşayır; onların oğlu döyüşdə həlak olub. Kənd tədricən boşalır, əri vəfat edəndən sonra isə Nabat tamamilə tək qalır.",
    source: "https://en.wikipedia.org/wiki/Nabat_(film)",
    poster: "posters/nabat-2014.jpg",
    trailerYoutubeId: "",
    backdrop: "backdrops/nabat-2014.webp",
    imageSource: "https://www.youtube.com/@AzerbaijanfilmStudio",
    featured: true
  },
  {
    id: "nar-bagi-2017",
    title: "Nar bağı",
    year: 2017,
    genre: "Dram",
    description: "Çexovun \"Albalı bağı\" pyesindən ilhamlanan filmdə Qabil 12 ildən sonra gözlənilmədən kənddəki ata evinə qayıdır. Onun qayıdışı nar bağının sahibi qoca Şamilin, gəlini Saranın və nəvəsi Cəlalın həyatını dəyişir.",
    source: "https://en.wikipedia.org/wiki/Pomegranate_Orchard",
    poster: "posters/nar-bagi-2017.jpg",
    trailerYoutubeId: "r9mujDmn9SU",
    backdrop: "backdrops/nar-bagi-2017.webp",
    imageSource: ["https://en.wikipedia.org/wiki/File:Pomegranate_Orchard.jpg", "https://www.youtube.com/@AzerbaijanfilmStudio"],
    featured: true
  },
  {
    id: "sepelenmis-olumler-arasinda-2020",
    title: "Səpələnmiş ölümlər arasında",
    year: 2020,
    genre: "Dram",
    description: "Mənalı həyat və əsl ailə axtarışında olan narahat gənc Davud bir gün ard-arda gözlənilməz hadisələrlə qarşılaşır. 77-ci Venesiya Film Festivalının əsas müsabiqəsinə seçilən bu yol filmi Azərbaycan, Meksika və ABŞ-ın birgə istehsalıdır.",
    source: "https://az.wikipedia.org/wiki/S%C9%99p%C9%99l%C9%99nmi%C5%9F_%C3%B6l%C3%BCml%C9%99r_aras%C4%B1nda",
    poster: "posters/sepelenmis-olumler-arasinda-2020.jpg",
    trailerYoutubeId: "jGLsh2vBo3I",
    backdrop: "",
    imageSource: "https://az.wikipedia.org/wiki/Fayl:S%C9%99p%C9%99l%C9%99nmi%C5%9F_%C3%B6l%C3%BCml%C9%99r_aras%C4%B1nda_(film,_2020).jpg"
  }
];
