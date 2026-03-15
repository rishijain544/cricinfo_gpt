const https = require('https');

// 200+ cricketers mapped directly to Wikipedia titles for instant lookup
const PLAYER_WIKI_MAP = {
  // INDIA
  'virat kohli':'Virat_Kohli','kohli':'Virat_Kohli','sachin tendulkar':'Sachin_Tendulkar',
  'sachin':'Sachin_Tendulkar','tendulkar':'Sachin_Tendulkar','ms dhoni':'MS_Dhoni',
  'dhoni':'MS_Dhoni','rohit sharma':'Rohit_Sharma','rohit':'Rohit_Sharma',
  'jasprit bumrah':'Jasprit_Bumrah','bumrah':'Jasprit_Bumrah','shubman gill':'Shubman_Gill',
  'gill':'Shubman_Gill','hardik pandya':'Hardik_Pandya','pandya':'Hardik_Pandya',
  'ravindra jadeja':'Ravindra_Jadeja','jadeja':'Ravindra_Jadeja','rishabh pant':'Rishabh_Pant',
  'pant':'Rishabh_Pant','suryakumar yadav':'Suryakumar_Yadav','surya':'Suryakumar_Yadav',
  'kl rahul':'KL_Rahul','rahul':'KL_Rahul','mohammed shami':'Mohammed_Shami','shami':'Mohammed_Shami',
  'ravichandran ashwin':'Ravichandran_Ashwin','ashwin':'Ravichandran_Ashwin',
  'yuvraj singh':'Yuvraj_Singh','yuvraj':'Yuvraj_Singh','sourav ganguly':'Sourav_Ganguly',
  'ganguly':'Sourav_Ganguly','rahul dravid':'Rahul_Dravid','dravid':'Rahul_Dravid',
  'vvs laxman':'VVS_Laxman','laxman':'VVS_Laxman','virender sehwag':'Virender_Sehwag',
  'sehwag':'Virender_Sehwag','kapil dev':'Kapil_Dev','kapil':'Kapil_Dev',
  'anil kumble':'Anil_Kumble','kumble':'Anil_Kumble','harbhajan singh':'Harbhajan_Singh',
  'harbhajan':'Harbhajan_Singh','zaheer khan':'Zaheer_Khan','zaheer':'Zaheer_Khan',
  'shreyas iyer':'Shreyas_Iyer','axar patel':'Axar_Patel','kuldeep yadav':'Kuldeep_Yadav',
  'yuzvendra chahal':'Yuzvendra_Chahal','chahal':'Yuzvendra_Chahal','sanju samson':'Sanju_Samson',
  'cheteshwar pujara':'Cheteshwar_Pujara','pujara':'Cheteshwar_Pujara',
  'mohammed siraj':'Mohammed_Siraj','siraj':'Mohammed_Siraj','sunil gavaskar':'Sunil_Gavaskar',
  'gavaskar':'Sunil_Gavaskar','gautam gambhir':'Gautam_Gambhir','gambhir':'Gautam_Gambhir',
  // PAKISTAN
  'babar azam':'Babar_Azam','babar':'Babar_Azam','wasim akram':'Wasim_Akram','akram':'Wasim_Akram',
  'shoaib akhtar':'Shoaib_Akhtar','akhtar':'Shoaib_Akhtar','imran khan':'Imran_Khan',
  'shahid afridi':'Shahid_Afridi','afridi':'Shahid_Afridi','waqar younis':'Waqar_Younis',
  'waqar':'Waqar_Younis','younis khan':'Younis_Khan','younis':'Younis_Khan',
  'inzamam':'Inzamam-ul-Haq','saeed anwar':'Saeed_Anwar','javed miandad':'Javed_Miandad',
  'shaheen afridi':'Shaheen_Shah_Afridi','shaheen':'Shaheen_Shah_Afridi',
  'mohammad rizwan':'Mohammad_Rizwan_(cricketer)','rizwan':'Mohammad_Rizwan_(cricketer)',
  'fakhar zaman':'Fakhar_Zaman','haris rauf':'Haris_Rauf','naseem shah':'Naseem_Shah',
  'shadab khan':'Shadab_Khan_(cricketer)','saqlain mushtaq':'Saqlain_Mushtaq',
  // AUSTRALIA
  'steve smith':'Steve_Smith_(cricketer)','smith':'Steve_Smith_(cricketer)',
  'pat cummins':'Pat_Cummins','cummins':'Pat_Cummins','david warner':'David_Warner_(cricketer)',
  'warner':'David_Warner_(cricketer)','ricky ponting':'Ricky_Ponting','ponting':'Ricky_Ponting',
  'adam gilchrist':'Adam_Gilchrist','gilchrist':'Adam_Gilchrist','gilly':'Adam_Gilchrist',
  'shane warne':'Shane_Warne','warne':'Shane_Warne','mitchell starc':'Mitchell_Starc',
  'starc':'Mitchell_Starc','travis head':'Travis_Head','head':'Travis_Head',
  'marnus labuschagne':'Marnus_Labuschagne','labuschagne':'Marnus_Labuschagne',
  'don bradman':'Don_Bradman','bradman':'Don_Bradman','glenn mcgrath':'Glenn_McGrath',
  'mcgrath':'Glenn_McGrath','brett lee':'Brett_Lee','matthew hayden':'Matthew_Hayden',
  'hayden':'Matthew_Hayden','michael clarke':'Michael_Clarke_(cricketer)',
  'nathan lyon':'Nathan_Lyon','lyon':'Nathan_Lyon','josh hazlewood':'Josh_Hazlewood',
  'hazlewood':'Josh_Hazlewood','usman khawaja':'Usman_Khawaja','khawaja':'Usman_Khawaja',
  // ENGLAND
  'ben stokes':'Ben_Stokes','stokes':'Ben_Stokes','joe root':'Joe_Root','root':'Joe_Root',
  'jos buttler':'Jos_Buttler','buttler':'Jos_Buttler','james anderson':'James_Anderson_(cricketer)',
  'anderson':'James_Anderson_(cricketer)','stuart broad':'Stuart_Broad','broad':'Stuart_Broad',
  'andrew flintoff':'Andrew_Flintoff','flintoff':'Andrew_Flintoff','freddie':'Andrew_Flintoff',
  'kevin pietersen':'Kevin_Pietersen','kp':'Kevin_Pietersen','alastair cook':'Alastair_Cook',
  'cook':'Alastair_Cook','ian botham':'Ian_Botham','botham':'Ian_Botham',
  'jofra archer':'Jofra_Archer','archer':'Jofra_Archer','harry brook':'Harry_Brook',
  'brook':'Harry_Brook','jonny bairstow':'Jonny_Bairstow','bairstow':'Jonny_Bairstow',
  'zak crawley':'Zak_Crawley','crawley':'Zak_Crawley',
  // NEW ZEALAND
  'kane williamson':'Kane_Williamson','williamson':'Kane_Williamson','ross taylor':'Ross_Taylor',
  'brendon mccullum':'Brendon_McCullum','mccullum':'Brendon_McCullum','baz':'Brendon_McCullum',
  'trent boult':'Trent_Boult','boult':'Trent_Boult','tim southee':'Tim_Southee','southee':'Tim_Southee',
  'martin crowe':'Martin_Crowe','crowe':'Martin_Crowe','richard hadlee':'Richard_Hadlee',
  'hadlee':'Richard_Hadlee','devon conway':'Devon_Conway','conway':'Devon_Conway',
  'tom latham':'Tom_Latham','lockie ferguson':'Lockie_Ferguson',
  // WEST INDIES
  'brian lara':'Brian_Lara','lara':'Brian_Lara','viv richards':'Viv_Richards','richards':'Viv_Richards',
  'garfield sobers':'Garfield_Sobers','sobers':'Garfield_Sobers','clive lloyd':'Clive_Lloyd',
  'curtly ambrose':'Curtly_Ambrose','ambrose':'Curtly_Ambrose','malcolm marshall':'Malcolm_Marshall',
  'michael holding':'Michael_Holding','holding':'Michael_Holding','chris gayle':'Chris_Gayle',
  'gayle':'Chris_Gayle','kieron pollard':'Kieron_Pollard','pollard':'Kieron_Pollard',
  'dwayne bravo':'Dwayne_Bravo','bravo':'Dwayne_Bravo','andre russell':'Andre_Russell',
  'russell':'Andre_Russell','sunil narine':'Sunil_Narine','narine':'Sunil_Narine',
  'nicholas pooran':'Nicholas_Pooran','pooran':'Nicholas_Pooran','jason holder':'Jason_Holder',
  // SOUTH AFRICA
  'ab de villiers':'AB_de_Villiers','ab':'AB_de_Villiers','de villiers':'AB_de_Villiers',
  'kagiso rabada':'Kagiso_Rabada','rabada':'Kagiso_Rabada','dale steyn':'Dale_Steyn','steyn':'Dale_Steyn',
  'hashim amla':'Hashim_Amla','amla':'Hashim_Amla','graeme smith':'Graeme_Smith',
  'shaun pollock':'Shaun_Pollock','pollock':'Shaun_Pollock','allan donald':'Allan_Donald',
  'faf du plessis':'Faf_du_Plessis','faf':'Faf_du_Plessis','quinton de kock':'Quinton_de_Kock',
  'de kock':'Quinton_de_Kock','temba bavuma':'Temba_Bavuma','bavuma':'Temba_Bavuma',
  'anrich nortje':'Anrich_Nortje','aiden markram':'Aiden_Markram','markram':'Aiden_Markram',
  'david miller':'David_Miller_(cricketer)','heinrich klaasen':'Heinrich_Klaasen',
  // SRI LANKA
  'muttiah muralitharan':'Muttiah_Muralitharan','murali':'Muttiah_Muralitharan',
  'kumar sangakkara':'Kumar_Sangakkara','sangakkara':'Kumar_Sangakkara',
  'mahela jayawardene':'Mahela_Jayawardene','jayawardene':'Mahela_Jayawardene',
  'sanath jayasuriya':'Sanath_Jayasuriya','jayasuriya':'Sanath_Jayasuriya',
  'lasith malinga':'Lasith_Malinga','malinga':'Lasith_Malinga','chaminda vaas':'Chaminda_Vaas',
  'wanindu hasaranga':'Wanindu_Hasaranga','hasaranga':'Wanindu_Hasaranga',
  'dimuth karunaratne':'Dimuth_Karunaratne','angelo mathews':'Angelo_Mathews',
  'kusal mendis':'Kusal_Mendis','pathum nissanka':'Pathum_Nissanka',
  // BANGLADESH
  'shakib al hasan':'Shakib_Al_Hasan','shakib':'Shakib_Al_Hasan','tamim iqbal':'Tamim_Iqbal',
  'tamim':'Tamim_Iqbal','mushfiqur rahim':'Mushfiqur_Rahim','mustafizur rahman':'Mustafizur_Rahman',
  'mehidy hasan':'Mehidy_Hasan_Miraz','taskin ahmed':'Taskin_Ahmed',
  // AFGHANISTAN
  'rashid khan':'Rashid_Khan_(cricketer)','rashid':'Rashid_Khan_(cricketer)',
  'mohammad nabi':'Mohammad_Nabi','nabi':'Mohammad_Nabi','mujeeb ur rahman':'Mujeeb_Ur_Rahman',
  'rahmanullah gurbaz':'Rahmanullah_Gurbaz','gurbaz':'Rahmanullah_Gurbaz',
  'ibrahim zadran':'Ibrahim_Zadran',
  // ZIMBABWE
  'heath streak':'Heath_Streak','andy flower':'Andy_Flower','sikandar raza':'Sikandar_Raza',
  'raza':'Sikandar_Raza',
  // LEGENDS
  'wg grace':'W._G._Grace','jack hobbs':'Jack_Hobbs','len hutton':'Len_Hutton',
  'denis compton':'Denis_Compton','fred trueman':'Fred_Trueman','frank worrell':'Frank_Worrell',
};

function fetchWikipedia(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'en.wikipedia.org',
      path,
      headers: { 'User-Agent': 'CricketGPT/1.0 (cricket chatbot)' },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

async function getWikipediaImage(wikiTitle) {
  try {
    const encoded = encodeURIComponent(wikiTitle);
    const data = await fetchWikipedia(`/w/api.php?action=query&titles=${encoded}&prop=pageimages&format=json&pithumbsize=600`);
    if (!data) return [];
    const pages = data.query?.pages || {};
    const images = [];
    for (const page of Object.values(pages)) {
      const thumb = page.thumbnail;
      if (thumb?.source) {
        const src = thumb.source;
        ['400px','350px','300px','250px'].forEach(size => {
          images.push({
            url: src.replace(/\/\d+px-/, `/${size}-`),
            thumb: src,
            title: page.title || wikiTitle,
          });
        });
        break;
      }
    }
    return images.slice(0, 4);
  } catch { return []; }
}

async function searchWikipediaForPlayer(name) {
  try {
    const q = encodeURIComponent(`${name} cricketer`);
    const data = await fetchWikipedia(`/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=5`);
    if (!data) return [];
    for (const result of (data.query?.search || [])) {
      const snippet = result.snippet?.toLowerCase() || '';
      if (['cricket','batsman','bowler','wicket','test','odi','t20'].some(kw => snippet.includes(kw))) {
        const images = await getWikipediaImage(result.title.replace(/ /g, '_'));
        if (images.length) return images;
      }
    }
    return [];
  } catch { return []; }
}

async function getPlayerImages(name) {
  const nameLower = name.toLowerCase().trim();
  // Check direct map first (instant)
  for (const [key, wikiTitle] of Object.entries(PLAYER_WIKI_MAP)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      const images = await getWikipediaImage(wikiTitle);
      if (images.length) return images;
      break;
    }
  }
  // Fallback: auto-search Wikipedia
  return searchWikipediaForPlayer(name);
}

function isImageRequest(question) {
  const q = question.toLowerCase();
  const imageKeywords = ['show image','show photo','show picture','show pic','show me','image of','photo of','picture of','pic of','get image','find photo','display image','see photo','looks like','look like'];
  const hasImageKw = imageKeywords.some(kw => q.includes(kw)) || ['image','photo','picture','pic','show','see','look'].some(w => q.includes(w));
  if (!hasImageKw) return null;
  // Check map
  for (const key of Object.keys(PLAYER_WIKI_MAP)) {
    if (q.includes(key)) return key.replace(/\b\w/g, c => c.toUpperCase());
  }
  // Extract name
  for (const kw of ['image of','photo of','picture of','pic of','show me image of','show me photo of','show image of','show photo of','show me']) {
    if (q.includes(kw)) {
      let after = q.split(kw)[1]?.trim() || '';
      after = after.replace(/\b(cricketer|player|cricket|image|photo|picture|pic|please|the|a|an|me)\b/g,'').trim().replace(/\s+/g,' ');
      if (after.length > 2) return after.replace(/\b\w/g, c => c.toUpperCase());
    }
  }
  return null;
}

module.exports = { getPlayerImages, isImageRequest };
