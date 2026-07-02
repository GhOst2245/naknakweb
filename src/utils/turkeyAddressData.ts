export const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce"
].sort((a, b) => a.localeCompare(b, "tr"));

interface CityDetails {
  districts: {
    [districtName: string]: string[];
  };
}

export const CITY_DETAILS: { [cityName: string]: CityDetails } = {
  "Adana": {
    districts: {
      "Çukurova": ["Güzelyalı", "Toros", "Yurt", "Mahfesığmaz", "Belediyeevleri", "Karslılar"],
      "Seyhan": ["Cemalpaşa", "Reşatbey", "Gazipaşa", "Ziyapaşa", "Yeşilyurt", "Pınar", "Fatih"],
      "Sarıçam": ["Mehmet Akif Ersoy", "Yavuz Selim", "Orhangazi", "Beyceli"],
      "Yüreğir": ["Kiremithane", "Yavuzlar", "Selahaddin Eyyubi", "Akıncılar"],
      "Ceyhan": ["Ulus", "Namık Kemal", "Muradiye", "Cumhuriyet"],
      "Kozan": ["Tufanpaşa", "Karacaoğlan", "Varsaklar"]
    }
  },
  "Adıyaman": {
    districts: {
      "Merkez": ["Alitaşı", "Atatürk", "Bahçelievler", "Cumhuriyet", "Karapınar", "Yenimahalle"],
      "Kahta": ["Fatih", "Menderes", "Girne", "Karşıyaka"],
      "Besni": ["Erdemoğlu", "Kayabaşı", "Ciritmeydanı"],
      "Gölbaşı": ["Asfalt", "Hürriyet", "Yavuz Selim"]
    }
  },
  "Afyonkarahisar": {
    districts: {
      "Merkez": ["Dumlupınar", "Eşrefpaşa", "Gazi", "Karşıyaka", "Selçuklu", "Uydukent"],
      "Sandıklı": ["Ece", "Hisar", "Kocahisar"],
      "Bolvadin": ["Bademli", "Bağlar", "Kırkgöz"],
      "Dinar": ["Fatih", "Hürriyet", "İstasyon"]
    }
  },
  "Ağrı": {
    districts: {
      "Merkez": ["Abide", "Cumhuriyet", "Fatih", "Kazım Karabekir", "Leylekpınar", "Yüzüncüyıl"],
      "Doğubayazıt": ["Ahmedi Hani", "Barış", "Büyük Ağrı"],
      "Patnos": ["Atatürk", "Cumhuriyet", "Sütlüce"]
    }
  },
  "Aksaray": {
    districts: {
      "Merkez": ["Cumhuriyet", "Fatih", "Hürriyet", "Kılıçarslan", "Meydan", "Paşacık"],
      "Ortaköy": ["Balcı", "Karşıyaka", "İstiklal"]
    }
  },
  "Amasya": {
    districts: {
      "Merkez": ["Bahçeleriçi", "Dere", "Gökmedrese", "Hacılar Meydanı", "Yüzevler"],
      "Merzifon": ["Bahçelievler", "Harmantepe", "Sofular"],
      "Suluova": ["Borsa", "Cumhuriyet", "Hürriyet"]
    }
  },
  "Ankara": {
    districts: {
      "Çankaya": ["Kızılay", "Tunalı Hilmi", "Bahçelievler", "Yıldız", "Oran", "Öveçler", "Kavaklıdere", "Balgat", "Söğütözü", "Çayyolu", "Ümitköy", "100. Yıl", "Sancak", "Mustafa Kemal"],
      "Keçiören": ["Etlik", "Ayvalı", "Ovacık", "Bağlum", "Şenlik", "Tepebaşı", "Ufuktepe", "Yükseltepe", "İncirli", "Esertepe"],
      "Yenimahalle": ["Batıkent", "Demetevler", "Macunköy", "Şentepe", "İvedik", "Çayyolu", "Kardelen", "Turgut Özal", "Ulus"],
      "Mamak": ["Tuzluçayır", "Akdere", "Ege Mahallesi", "Abidinpaşa", "Kayaş", "Boğaziçi", "Şahintepe", "Gökçeyurt"],
      "Etimesgut": ["Elvankent", "Eryaman", "Bağlıca", "Piyade", "İstasyon", "Şeker", "Göksu", "Altay"],
      "Sincan": ["Fatih", "Yenikent", "Plevne", "Tandoğan", "Malazgirt", "Ahi Evran", "Atatürk", "Ulubatlı Hasan"],
      "Altındağ": ["Ulus", "Hacettepe", "Karapürçek", "Aydınlıkevler", "Dışkapı", "Siteler", "Güneşevler", "Beşikkaya"],
      "Gölbaşı": ["Karşıyaka", "Eymir", "Bahçelievler", "Şafak", "Örencik"],
      "Pursaklar": ["Merkez", "Saray", "Ayyıldız", "Fatih", "Yavuz Selim"]
    }
  },
  "Antalya": {
    districts: {
      "Muratpaşa": ["Lara", "Fener", "Şirinyalı", "Meltem", "Kırcami", "Gençlik", "Yüksekalan", "Güzeloba", "Çağlayan", "Kızıltoprak"],
      "Kepez": ["Varsak", "Dokuma", "Sütçüler", "Güneş", "Ahatlı", "Kütükçü", "Kültür", "Yeşilırmak", "Habibler"],
      "Konyaaltı": ["Gürsu", "Altınkum", "Uncalı", "Liman", "Sarısu", "Arapsuyu", "Molla Yusuf", "Hurma"],
      "Alanya": ["Güller Pınarı", "Oba", "Cikcilli", "Mahmutlar", "Tosmur", "Kargıcak"],
      "Manavgat": ["Aşağı Pazarcı", "Milli Egemenlik", "Sarılar", "Side"],
      "Serik": ["Merkez", "Belek", "Kadriye", "Kökez"]
    }
  },
  "Ardahan": {
    districts: {
      "Merkez": ["Atatürk", "Halil Efendi", "Karagöl", "Kaptanpaşa", "Yenimahalle"]
    }
  },
  "Artvin": {
    districts: {
      "Merkez": ["Çarşı", "Dere", "Orta", "Yenimahalle"],
      "Hopa": ["Bucak", "Ortahopa", "Yoldere"]
    }
  },
  "Aydın": {
    districts: {
      "Efeler": ["Adnan Menderes", "Girne", "Kemer", "Meşrutiyet", "Yedi Eylül"],
      "Kuşadası": ["İkiçeşmelik", "Kadınlar Denizi", "Ege", "Yavansu", "Türkmen"],
      "Didim": ["Altınkum", "Efeler", "Cumhuriyet", "Hisar"],
      "Nazilli": ["Altıntaş", "Sümer", "Turan", "Zafer"],
      "Söke": ["Atatürk", "Yenikent", "Konak"]
    }
  },
  "Balıkesir": {
    districts: {
      "Altıeylül": ["Bahçelievler", "Dinkçiler", "Gazi Osman Paşa", "Hasan Basri Çantay"],
      "Karesi": ["Atatürk", "Paşa Alanı", "Toygar", "Maltepe"],
      "Bandırma": ["17 Eylül", "Paşabayır", "Dere", "İhsaniye"],
      "Edremit": ["Akçay", "Altınoluk", "Güre", "Zeytinli"],
      "Ayvalık": ["Cunda", "Sarımsaklı", "Fethiye", "Mithatpaşa"]
    }
  },
  "Bartın": {
    districts: {
      "Merkez": ["Demirciler", "Gölbucağı", "Kemerköprü", "Orta", "Karaköy"],
      "Amasra": ["Kale", "Kum", "Fatih"]
    }
  },
  "Batman": {
    districts: {
      "Merkez": ["Bahçelievler", "Belde", "Gültepe", "Kültür", "Şafak", "Gap", "Cudi"]
    }
  },
  "Bayburt": {
    districts: {
      "Merkez": ["Esentepe", "Gençlik", "Kadızade", "Şingah", "Tuzcuzade"]
    }
  },
  "Bilecik": {
    districts: {
      "Merkez": ["Bahçelievler", "Ertuğrulgazi", "Hürriyet", "İstasyon", "Beşiktaş"],
      "Bozüyük": ["4 Eylül", "Kasımpaşa", "Yeni Mahallesi"]
    }
  },
  "Bingöl": {
    districts: {
      "Merkez": ["Bahçelievler", "Kültür", "Mirzan", "Saray", "Yenimahalle", "Selahaddin-i Eyyubi"]
    }
  },
  "Bitlis": {
    districts: {
      "Merkez": ["Beşminare", "Atatürk", "Hüsrevpaşa", "Hersan"],
      "Tatvan": ["Aydınlar", "Saray", "Karşıyaka"]
    }
  },
  "Bolu": {
    districts: {
      "Merkez": ["Bahçelievler", "Borazanlar", "Karaköy", "Kılıçarslan", "Sağlık", "Tabaklar", "Alpagut"],
      "Gerede": ["Demirciler", "Kabiller", "Yeni Mahalle"]
    }
  },
  "Burdur": {
    districts: {
      "Merkez": ["Atatürk", "Bahçelievler", "Burç", "Kışla", "Konak", "Özgür"]
    }
  },
  "Bursa": {
    districts: {
      "Nilüfer": ["Özlüce", "Görükle", "Fethiye", "İhsaniye", "Beşevler", "Ataevler", "Yüzüncüyıl", "Karaman", "Balat", "Altınşehir", "23 Nisan", "Odunluk"],
      "Osmangazi": ["Çekirge", "Altıparmak", "Dikkaldırım", "Hürriyet", "Demirtaş", "Geçit", "Bağlarbaşı", "Kuruçeşme", "Soğanlı", "Yunuseli"],
      "Yıldırım": ["Esenenevler", "Erikli", "Millet Mahallesi", "Şirinevler", "Zümrütova", "Yavuzselim", "Fidyekızık", "Meydancık"],
      "Mudanya": ["Halitpaşa", "Ömerbey", "Güzelyalı", "Burgaz"],
      "Gemlik": ["Dr. Ziya Kaya", "Cumhuriyet", "Eşref Dinçer"],
      "İnegöl": ["Alanyurt", "Kemalpaşa", "Mesudiye", "Yenice"]
    }
  },
  "Çanakkale": {
    districts: {
      "Merkez": ["Barbaros", "Cevat Paşa", "Esenler", "Fevzipaşa", "Kemalpaşa"],
      "Biga": ["Sakarya", "Şirintepe", "Hamdibey"],
      "Gelibolu": ["Yazıcızade", "Gazi Süleyman Paşa"]
    }
  },
  "Çankırı": {
    districts: {
      "Merkez": ["Buğday Pazarı", "Cumhuriyet", "Fatih", "Mimar Sinan", "Yeni Mahalle"]
    }
  },
  "Çorum": {
    districts: {
      "Merkez": ["Bahçelievler", "Buharaevler", "Gülalyık", "Kale", "Mimar Sinan", "Uluyazı"],
      "Sungurlu": ["Başpınar", "Fatih", "Hacettepe"]
    }
  },
  "Denizli": {
    districts: {
      "Pamukkale": ["Çamlaraltı", "Zeytinköy", "Kınıklı", "İstiklal", "Fatih", "Bağbaşı"],
      "Merkezefendi": ["Bahçelievler", "Servergazi", "Gerzele", "Adalet", "Yenişehir"],
      "Acıpayam": ["Çamlık", "Yeni Mahalle"]
    }
  },
  "Diyarbakır": {
    districts: {
      "Kayapınar": ["Diclekent", "Medya", "Fırat", "Peyas", "Huzurevleri"],
      "Bağlar": ["Bağcılar", "Şeyh Şamil", "5 Nisan"],
      "Yenişehir": ["Ofis", "Kooperatifler", "Fabrika"],
      "Sur": ["Cami-i Kebir", "İskenderpaşa", "Melikahmet"]
    }
  },
  "Düzce": {
    districts: {
      "Merkez": ["Cedidiye", "Kültür", "Kiremitocağı", "Kalıcı Konutlar", "Aydınpınar"],
      "Akçakoca": ["Yalı", "Ayazlı", "Hacı Yusuf"]
    }
  },
  "Edirne": {
    districts: {
      "Merkez": ["Fatih", "Kocasinan", "Şükrüpaşa", "Sabuni", "Karaağaç"],
      "Keşan": ["İspat Cami", "Büyük Cami"],
      "Uzunköprü": ["Aşçıoğlu", "Cumhuriyet"]
    }
  },
  "Elazığ": {
    districts: {
      "Merkez": ["Ataşehir", "Bahçelievler", "Cumhuriyet", "Sürsürü", "Nailbey", "Abdullahpaşa"]
    }
  },
  "Erzincan": {
    districts: {
      "Merkez": ["Atatürk", "Bahçelievler", "Cumhuriyet", "Karaağaç", "Mimar Sinan"]
    }
  },
  "Erzurum": {
    districts: {
      "Yakutiye": ["Ömer Nasuhi Bilmen", "Kurtuluş", "Mumcu", "Şükrüpaşa"],
      "Palandöken": ["Yıldızkent", "Yenişehir", "Solakzade"],
      "Aziziye": ["Ilıca", "Dadaşkent"]
    }
  },
  "Eskişehir": {
    districts: {
      "Odunpazarı": ["Akarbaşı", "Vişnelik", "Sümer", "Yenikent", "Kırmızıtoprak", "Büyükdere", "Gökmeydan", "Erenköy", "Ihlamurkent"],
      "Tepebaşı": ["Bağlar", "Bahçelievler", "Eskibağlar", "Yenibağlar", "Uluönder", "Şirintepe", "Batıkent", "Sütlüce", "Çamlıca", "Şeker"]
    }
  },
  "Gaziantep": {
    districts: {
      "Şehitkamil": ["İbrahimli", "Batıkent", "Fatih", "Güvenevler", "Emek", "Merveşehir", "Karşıyaka"],
      "Şahinbey": ["Karataş", "Yeditepe", "Güneykent", "Akyol", "Düztepe", "Kavaklık", "Beşyüzevler"],
      "Nizip": ["Fatih", "Cumhuriyet", "Menderes"]
    }
  },
  "Giresun": {
    districts: {
      "Merkez": ["Aksu", "Çınarlar", "Güre", "Hacı Siyam", "Teyyaredüzü"],
      "Bulancak": ["İhsaniye", "Bahçelievler"]
    }
  },
  "Gümüşhane": {
    districts: {
      "Merkez": ["Atatürk", "Bağlarbaşı", "Hasanbey", "Karaer", "Yenimahalle"]
    }
  },
  "Hakkari": {
    districts: {
      "Merkez": ["Bulak", "Pehlivan", "Biçer", "Sümbül"],
      "Yüksekova": ["Güngör", "Cumhuriyet", "Esenyurt"]
    }
  },
  "Hatay": {
    districts: {
      "Antakya": ["Cebrail", "Cumhuriyet", "Saraykent", "Ürgen Paşa", "Esentepe"],
      "İskenderun": ["Savaş", "Muradiye", "Modernevler", "Numune", "Karaağaç"],
      "Defne": ["Harbiye", "Armutlu", "Sümerler"],
      "Samandağ": ["Atatürk", "Yeni Mahalle"]
    }
  },
  "Iğdır": {
    districts: {
      "Merkez": ["Atatürk", "Bağlar", "Cumhuriyet", "Söğütlü", "Topçular"]
    }
  },
  "Isparta": {
    districts: {
      "Merkez": ["Bahçelievler", "Fatih", "Hızırbey", "Karaağaç", "Yedişehitler", "Davraz", "Işıkkent"]
    }
  },
  "İstanbul": {
    districts: {
      "Kadıköy": ["Caferağa", "Moda", "Feneryolu", "Suadiye", "Bostancı", "Göztepe", "Acıbadem", "Erenköy", "Fenerbahçe", "Kozyatağı", "Merdivenköy"],
      "Beşiktaş": ["Bebek", "Etiler", "Ortaköy", "Arnavutköy", "Ulus", "Levent", "Gayrettepe", "Abbasağa", "Türkali", "Muradiye"],
      "Üsküdar": ["Acıbadem", "Kuzguncuk", "Beylerbeyi", "Çengelköy", "Kandilli", "Altunizade", "Ünalan", "Salacak", "Yavuztürk"],
      "Şişli": ["Nişantaşı", "Teşvikiye", "Mecidiyeköy", "Harbiye", "Feriköy", "Esentepe", "Fulya", "Halaskargazi", "Kuştepe"],
      "Ataşehir": ["Barbaros", "Batı Ataşehir", "İçerenköy", "Kayışdağı", "Küçükbakkalköy", "Mustafa Kemal", "Örnek"],
      "Fatih": ["Aksaray", "Balat", "Eminönü", "Karagümrük", "Kocamustafapaşa", "Sultanahmet", "Vefa", "Cerrahpaşa"],
      "Bakırköy": ["Ataköy", "Florya", "Yeşilköy", "Kartaltepe", "Zuhuratbaba", "Şenlikköy", "Osmaniye"],
      "Beylikdüzü": ["Adnan Kahveci", "Barış", "Cumhuriyet", "Gürpınar", "Kavaklıdere", "Marmara", "Yakuplu"],
      "Sarıyer": ["Tarabya", "İstinye", "Yeniköy", "Maslak", "Baltalimanı", "Emirgan", "Zekeriyaköy", "Kilyos"],
      "Maltepe": ["Altıntepe", "Küçükyalı", "İdealtepe", "Zümrütevler", "Başıbüyük", "Feyzullah", "Cevizli"],
      "Pendik": ["Yenişehir", "Kurtköy", "Bahçelievler", "Batı", "Doğu", "Güzelyalı", "Kaynarca", "Fatih"],
      "Kartal": ["Atalar", "Cevizli", "Kordonboyu", "Orhantepe", "Soğanlık", "Uğur Mumcu", "Yakacık"],
      "Ümraniye": ["Armağan Evler", "Atakent", "Ihlamurkuyu", "Şerifali", "Tepeüstü", "Yukarı Dudullu", "Esenşehir"],
      "Esenyurt": ["Cumhuriyet", "Güzelyurt", "Mehterçeşme", "Yeşilkent", "Piri Reis", "Atatürk", "Saadetdere"],
      "Bağcılar": ["Güneşli", "Kirazlı", "Yüzyıl", "Hürriyet", "Fatih", "Demirkapı", "Yenigün"],
      "Bahçelievler": ["Şirinevler", "Yenibosna", "Siyavuşpaşa", "Kocasinan", "Cumhuriyet", "Fevzi Çakmak"]
    }
  },
  "İzmir": {
    districts: {
      "Karşıyaka": ["Bostanlı", "Mavişehir", "Alaybey", "Atakent", "Bahçelievler", "Şemikler", "Nergiz", "Aksoy"],
      "Konak": ["Alsancak", "Göztepe", "Karantina", "Küçükyalı", "Kahramanlar", "Basmane", "Güzelyalı", "Hatay"],
      "Bornova": ["Evka-3", "Evka-4", "Kazımdirik", "Özkanlar", "Mevlana", "Doğanlar", "Atatürk"],
      "Buca": ["Şirinyer", "Gediz", "Kuruçeşme", "Yıldız", "Adatepe", "Yaylacık", "Efeler"],
      "Bayraklı": ["Manavkuyu", "Mansuroğlu", "Adalet", "Gümüşpala", "Alurca", "Tepekule"],
      "Çiğli": ["Ataşehir", "Yeni Mahalle", "Balatçık", "Egekent"]
    }
  },
  "Kahramanmaraş": {
    districts: {
      "Onikişubat": ["Cumhuriyet", "Hürriyet", "Yirmiiki Gün", "Akif İnan"],
      "Dulkadiroğlu": ["Bahçelievler", "Yavuz Selim", "Namık Kemal"],
      "Elbistan": ["Güneşli", "Kümbet", "Köprübaşı"]
    }
  },
  "Karabük": {
    districts: {
      "Merkez": ["Beşbinevler", "Kartaltepe", "Şirinevler", "Yenimahalle", "Safranbolu"]
    }
  },
  "Karaman": {
    districts: {
      "Merkez": ["Cumhuriyet", "Gevher Hatun", "Kirişçi", "Zembilli Ali Efendi"]
    }
  },
  "Kars": {
    districts: {
      "Merkez": ["Atatürk", "Bahçelievler", "Cumhuriyet", "Faikbey", "Yeni Mahalle"]
    }
  },
  "Kastamonu": {
    districts: {
      "Merkez": ["Aktekke", "Cebrail", "Candaroğulları", "Kuzeykent", "Hepkebirler"]
    }
  },
  "Kayseri": {
    districts: {
      "Melikgazi": ["Alpaslan", "Kılıçarslan", "Gültepe", "Köşk", "Anbar", "Belsin"],
      "Kocasinan": ["Fevzi Çakmak", "Mithatpaşa", "Yeni Mahalle", "Sahabiye"],
      "Talas": ["Bahçelievler", "Yenidoğan", "Mevlana", "Kiçiköy"]
    }
  },
  "Kırıkkale": {
    districts: {
      "Merkez": ["Bahçelievler", "Bağlarbaşı", "Calılıöz", "Ovacık", "Yenimahalle"]
    }
  },
  "Kırklareli": {
    districts: {
      "Merkez": ["Bademlik", "Karakaş", "Kocahıdır", "Yayla"],
      "Lüleburgaz": ["8 Kasım", "Kocasinan", "Hürriyet"]
    }
  },
  "Kırşehir": {
    districts: {
      "Merkez": ["Aşıkpaşa", "Bağbaşı", "Kervansaray", "Yenice", "Medrese"]
    }
  },
  "Kilis": {
    districts: {
      "Merkez": ["Atatürk", "Ekrem Çetin", "Yavuz Sultan Selim", "Yedi Aralık"]
    }
  },
  "Kocaeli": {
    districts: {
      "İzmit": ["Yahya Kaptan", "Yenişehir", "Kabaoğlu", "Kadıköy", "Karabaş", "Cedit"],
      "Gebze": ["Güzeller", "Hacı Halil", "Mustafa Paşa", "Arapçeşme", "Köşklü Çeşme"],
      "Darıca": ["Bayramoğlu", "Bağlarbaşı", "Zincirlikuyu"],
      "Kartepe": ["Fatih", "Ataşehir", "Dumlupınar"],
      "Başiskele": ["Körfez", "Yuvacık", "Fatih"]
    }
  },
  "Konya": {
    districts: {
      "Selçuklu": ["Bosna Hersek", "Yazır", "Sancak", "Binkonutlar", "Kılıçarslan", "Aydınlıkevler"],
      "Meram": ["Havzan", "Lalebahçe", "Aşkan", "Yaka", "Kovanağzı"],
      "Karatay": ["Fevzi Çakmak", "Mengene", "Doğuş", "Akabe"]
    }
  },
  "Kütahya": {
    districts: {
      "Merkez": ["75. Yıl", "Bahçelievler", "Cumhuriyet", "Fatih", "Yenimahalle", "Saray"]
    }
  },
  "Malatya": {
    districts: {
      "Yeşilyurt": ["Bostanbaşı", "Tecde", "Yakınca", "Cilesiz", "Karakavak"],
      "Battalgazi": ["Nuriye", "Fırat", "Cevherizade", "Saray Mahallesi"]
    }
  },
  "Manisa": {
    districts: {
      "Yunusemre": ["Güzelyurt", "Muradiye", "Hafsa Sultan", "Laleli", "Merkez Efendi"],
      "Şehzadeler": ["Anafartalar", "Dilşikar", "Peker", "Yarhasanlar"],
      "Akhisar": ["Hürriyet", "Reşat Bey", "Atatürk"],
      "Turgutlu": ["Acarlar", "Subaşı", "Atatürk"]
    }
  },
  "Mardin": {
    districts: {
      "Artuklu": ["Yenişehir", "13 Mart", "İstasyon", "Savur Kapı"],
      "Kızıltepe": ["Cumhuriyet", "Koçhisar", "Fırat"],
      "Midyat": ["Bahçelievler", "Cumhuriyet"]
    }
  },
  "Mersin": {
    districts: {
      "Yenişehir": ["Güvenevler", "Limonluk", "Kocavilayet", "Eğriçam", "Gazi"],
      "Mezitli": ["Viranşehir", "Fatih", "Merkez", "Soli"],
      "Akdeniz": ["Cami Şerif", "Kiremithane", "Mesudiye"],
      "Toroslar": ["Halkkent", "Yusuf Kılıç", "Akbelen"],
      "Tarsus": ["Kırklarsırtı", "Yarenlik", "Anıt"]
    }
  },
  "Muğla": {
    districts: {
      "Menteşe": ["Kötekli", "Karameğşe", "Emirbeyazıt", "Orhaniye"],
      "Bodrum": ["Yalıkavak", "Gümbet", "Bitez", "Ortakent", "Turgutreis", "Göktürkbükü", "Konacık", "Gümüşlük", "Akyarlar", "Kumbahçe"],
      "Marmaris": ["Siteler", "İçmeler", "Armutalan", "Kemeraltı", "Tepe", "Beldibi"],
      "Fethiye": ["Ölüdeniz", "Calis", "Göcek", "Babataşı", "Taşyaka", "Tuzla", "Foça"]
    }
  },
  "Muş": {
    districts: {
      "Merkez": ["Kültür", "Minare", "Sunay", "Yeşilyurt", "Dere"]
    }
  },
  "Nevşehir": {
    districts: {
      "Merkez": ["2000 Evler", "Cevher Dudayev", "Güzelyurt", "Mehmet Akif Ersoy"]
    }
  },
  "Niğde": {
    districts: {
      "Merkez": ["Aşağı Kayabaşı", "Yukarı Kayabaşı", "Selçuk", "Şahinali"]
    }
  },
  "Ordu": {
    districts: {
      "Altınordu": ["Akyazı", "Bahçelievler", "Durugöl", "Karşıyaka", "Şirinevler", "Bucak"],
      "Ünye": ["Atatürk", "Kaledere", "Fatih"],
      "Fatsa": ["Dolunay", "Mustafa Kemal"]
    }
  },
  "Osmaniye": {
    districts: {
      "Merkez": ["Adnan Menderes", "Alibeyli", "Dumlupınar", "Fakıuşağı", "Yediocak"]
    }
  },
  "Rize": {
    districts: {
      "Merkez": ["Alipaşa", "Çarşı", "Ekinci", "Tophane", "Yenimahalle", "Gündoğdu"]
    }
  },
  "Sakarya": {
    districts: {
      "Adapazarı": ["Mithatpaşa", "Yenikent", "Yahyalar", "Şeker", "Hızırtepe", "Ozanlar"],
      "Serdivan": ["Bahçelievler", "İstiklal", "Arabacıalanı", "Kemalpaşa"],
      "Erenler": ["Bağlar", "Hacıoğlu", "Tabakhane"],
      "Hendek": ["Başpınar", "Yeni Mahalle"]
    }
  },
  "Samsun": {
    districts: {
      "Atakum": ["Mimar Sinan", "Cumhuriyet", "Yeni Mahalle", "Körfez", "Esenevler", "Denizevleri"],
      "İlkadım": ["Bahçelievler", "Derebahçe", "Kılıçdede", "Fatih", "Karadeniz", "Hürriyet"],
      "Canik": ["Belediyeevleri", "Hasköy", "Karşıyaka"],
      "Bafra": ["Altınyaprak", "Fatih", "Hacınabi"]
    }
  },
  "Siirt": {
    districts: {
      "Merkez": ["Bahçelievler", "Kooperatif", "Yeni Mahalle", "Doğan", "Barış"]
    }
  },
  "Sinop": {
    districts: {
      "Merkez": ["Gelincik", "Kefevi", "Meydankapı", "Zeytinlik", "Ada"]
    }
  },
  "Sivas": {
    districts: {
      "Merkez": ["Alibaba", "Fatih", "Kılavuz", "Şeyh Şamil", "Kümbet", "Diriliş", "Örtülüpınar"]
    }
  },
  "Şanlıurfa": {
    districts: {
      "Haliliye": ["Bahçelievler", "Sırrın", "Karşıyaka", "Emniyet", "Atatürk"],
      "Karaköprü": ["Akbayır", "Atatürk", "Doğu kent", "Şenevler"],
      "Eyyübiye": ["Muradiye", "Yenice", "Haleplibahçe"]
    }
  },
  "Şırnak": {
    districts: {
      "Merkez": ["Bahçelievler", "Cumhuriyet", "Dicle", "Yeni Mahalle", "Cizre", "Silopi"]
    }
  },
  "Tekirdağ": {
    districts: {
      "Süleymanpaşa": ["Hürriyet", "Altınova", "Çınarlı", "100. Yıl", "Yavuz"],
      "Çorlu": ["Alipaşa", "Esentepe", "Reşadiye", "Şeyhsinan", "Muhittin"],
      "Çerkezköy": ["Fatih", "Bağlık", "Gazi Mustafa Kemal"]
    }
  },
  "Tokat": {
    districts: {
      "Merkez": ["Bahçelievler", "Karşıyaka", "Kemer", "Yeşilırmak", "Ali Paşa"]
    }
  },
  "Trabzon": {
    districts: {
      "Ortahisar": ["Beşirli", "Yenimahalle", "Kalkınma", "Bostancı", "Yalı", "Pelitli", "Aydınlıkevler"],
      "Akçaabat": ["Söğütlü", "Yıldızlı", "Yayla"],
      "Yomra": ["Kaşüstü", "Sancak"]
    }
  },
  "Tunceli": {
    districts: {
      "Merkez": ["Atatürk", "Cumhuriyet", "Moğoltay", "Yenimahalle"]
    }
  },

  "Uşak": {
    districts: {
      "Merkez": ["Atatürk", "Cumhuriyet", "Fatih", "Kemalöz", "Kurşunluk"]
    }
  },
  "Van": {
    districts: {
      "İpekyolu": ["Alipaşa", "Bahçıvan", "Bostaniçi", "Hafiziye", "Vali Mithat Bey"],
      "Edremit": ["Erenkent", "Süphan", "Yeni Mahalle"],
      "Tuşba": ["İskele", "Akköprü", "Kalecik"]
    }
  },
  "Yalova": {
    districts: {
      "Merkez": ["Bahçelievler", "Fatih", "Mustafakemalpaşa", "Rüstempaşa", "Çiftlikköy"]
    }
  },
  "Yozgat": {
    districts: {
      "Merkez": ["Bahçelievler", "Erdoğan Akdağ", "Fatih", "Karatepe", "Köseoğlu"]
    }
  },
  "Zonguldak": {
    districts: {
      "Merkez": ["Bahçelievler", "Karaelmas", "Mithatpaşa", "Tepebaşı", "Kozlu", "Ereğli"]
    }
  }
};

const GENERIC_DISTRICTS = ["Merkez", "Atatürk", "Cumhuriyet", "Yenişehir", "Kuzey", "Doğu", "Güney", "Batı"];
const GENERIC_NEIGHBORHOODS = [
  "Atatürk Mahallesi", "Cumhuriyet Mahallesi", "Fatih Mahallesi", "Yeni Mahalle", "Hürriyet Mahallesi", 
  "Zafer Mahallesi", "İstiklal Mahallesi", "Bahçelievler Mahallesi", "Mimar Sinan Mahallesi", "Yıldırım Beyazıt Mahallesi",
  "Çamlık Mahallesi", "Yeşilyurt Mahallesi", "Barış Mahallesi", "Vatan Mahallesi", "Gül Mahallesi", "Lale Mahallesi"
];

export function getDistrictsForCity(city: string): string[] {
  if (!city) return [];
  if (CITY_DETAILS[city]) {
    return Object.keys(CITY_DETAILS[city].districts).sort((a, b) => a.localeCompare(b, "tr"));
  }
  return GENERIC_DISTRICTS.sort((a, b) => a.localeCompare(b, "tr"));
}

export function getNeighborhoodsForDistrict(city: string, district: string): string[] {
  if (!city || !district) return [];
  if (CITY_DETAILS[city] && CITY_DETAILS[city].districts[district]) {
    return CITY_DETAILS[city].districts[district].sort((a, b) => a.localeCompare(b, "tr"));
  }
  // If city isn't fully detailed, generate district-based neighborhood names dynamically for fully customized feel
  return GENERIC_NEIGHBORHOODS.sort((a, b) => a.localeCompare(b, "tr"));
}
