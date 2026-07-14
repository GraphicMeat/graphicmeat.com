const fs = require('fs');
const path = require('path');

const recipes = [
  {
    slug: 'jautienos-kumpio-suktinukai',
    source: 'https://mrukis.lt/jautienos-kumpio-suktinukai-ir-sventei-ir-kasdienai/',
    title: 'Jautienos kumpio suktinukai — ir šventei, ir kasdienai',
    shortTitle: 'Jautienos kumpio suktinukai',
    date: '2026-03-30', dateLabel: '2026 03 30', category: 'Kepsniai', image: 'recipe-rolls.jpg', width: 1400, height: 1050,
    description: 'Jautienos kumpis su grujeriu, karamelizuotais šalotais ir grybais — sodrus patiekalas šventei ir kasdienai.',
    prep: '10–15 min.', cook: '20–30 min.', servings: '4',
    intro: 'Pavasaris kviečia prie gaivesnių ir sodresnių skonių. Šiame recepte jautienos kumpis pagardinamas grujeriu, karamelizuotais šalotais ir apkeptais grybais, susukamas ir patiekiamas su gaiviomis salotomis bei karamelizuotu apelsinu.',
    ingredients: [
      ['Mėsai', ['~0,5 kg MR. Ūkio sprandinės, kumpio arba nugarinės', 'Druska ir pipirai pagal skonį']],
      ['Įdarui', ['2–3 šalotiniai svogūnai', 'Šiek tiek aliejaus kepimui', '3–4 valg. š. balzaminio acto', '1 arb. š. cukraus', '4–5 vidutiniai pievagrybiai', '4 riekės grujerio arba kito mėgstamo sūrio']],
      ['Patiekimui', ['1 didelis apelsinas', '2 valg. š. balzaminio acto', 'Traškių salotų lapai', '1 pomidoras', '1 avokadas', 'Aliejus, druska, pipirai ir šlakelis balzaminio acto']]
    ],
    steps: [
      'Jei mėsa šaldyta, lėtai atitirpinkite ją šaldytuve. Prieš kepimą maždaug valandą palaikykite kambario temperatūroje, kad keptų tolygiai.',
      'Mėsą perpjaukite išilgai, kad gautumėte išklotinę, ir lengvai pagardinkite druska bei pipirais. Šalotus supjaustykite plunksnelėmis, apkepkite aliejuje, įpilkite balzaminio acto ir suberkite cukrų. Troškinkite iki džemo konsistencijos. Toje pačioje keptuvėje apkepkite pjaustytus grybus.',
      'Ant jautienos dėkite sūrį, svogūnus ir grybus. Standžiai suvyniokite, apriškite kulinarine virvele ir supjaustykite porcijomis. Trumpai apskrudinkite keptuvėje, tada kepkite 180 °C orkaitėje 7–9 minutes.',
      'Keptuvėje su trupučiu aliejaus, balzaminio acto ir cukraus karamelizuokite apelsino riekeles. Lėkštėje paskleiskite salotas, sudėkite avokadą, pomidorą, karštus apelsinus ir jautienos suktinukus.'
    ]
  },
  {
    slug: 'neiprastas-befstrogenas',
    source: 'https://mrukis.lt/naujuju-vakarienei-neiprastas-befstrogenas/',
    title: 'Naujųjų vakarienei — neįprastas Befstrogenas', shortTitle: 'Neįprastas Befstrogenas',
    date: '2025-12-23', dateLabel: '2025 12 23', category: 'Vakarienė', image: 'recipe-stroganoff.jpg', width: 1200, height: 540,
    description: 'Šventinė Befstrogeno interpretacija su jautienos kepsniu, kremišku grybų padažu ir įdarytomis bulvėmis.',
    prep: '20–30 min.', cook: '1–1,5 val.', servings: '4',
    intro: 'Šiek tiek pakeista Befstrogeno versija, kurią galima paversti vakaro kulminacija: sultingas jautienos kepsnys, didelės traškia odele bulvės ir sodrus grybų padažas.',
    ingredients: [
      ['Kepsniui', ['~1 kg MR. Ūkio sprandinės, kumpio arba nugarinės', 'Druska ir pipirai pagal skonį']],
      ['Bulvėms', ['4–6 didelės bulvės', 'Šiek tiek aliejaus', 'Druska ir pipirai']],
      ['Padažui', ['2 dideli svogūnai', '4 česnako skiltelės', '500–600 g pievagrybių', '400 ml jautienos sultinio', '2 arb. š. garstyčių', '2 valg. š. Vorčesterio padažo', '½ arb. š. malto cinamono', '1–1½ arb. š. džiovintų čiobrelių', '2 valg. š. pomidorų pastos', '2 arb. š. kvietinių miltų', '200 ml riebios grietinėlės', 'Keli šaukštai grietinės', 'Druska ir pipirai']],
      ['Bulvių įdarui', ['80–100 g sviesto', 'Sauja petražolių', '150 g mėgstamo sūrio']]
    ],
    steps: [
      'Mėsą lėtai atitirpinkite šaldytuve, jei reikia, ir prieš kepimą palaikykite kambario temperatūroje.',
      'Bulves nuplaukite, subadykite šakute ir 6–8 minutes pašildykite mikrobangų krosnelėje. Apšlakstykite aliejumi, pagardinkite, suvyniokite į foliją ir kepkite 180 °C temperatūroje 60–80 minučių. Išvyniokite ir 5–7 minutes paskrudinkite grilio režimu.',
      'Padažui apkepkite svogūnus ir česnaką, sudėkite grybus ir gerai apskrudinkite. Įmaišykite prieskonius, pomidorų pastą ir miltus. Supilkite sultinį bei grietinėlę ir virkite iki tirštos, kreminės konsistencijos. Grietinę dėkite paskutinę.',
      'Jautieną stipriai apkepkite ketaus keptuvėje iš visų pusių, tada baikite kepti orkaitėje iki 54 °C vidinės temperatūros. Pagardinkite ir pailsinkite. Bulves įpjaukite, minkštimą sumaišykite su žolelių sviestu bei sūriu, ant viršaus dėkite plonai pjaustytą jautieną ir padažą.'
    ]
  },
  {
    slug: 'vengriskas-guliasas',
    source: 'https://mrukis.lt/vengriskas-guliasas-tikra-skoniu-jura-vestantiems-orams/',
    title: 'Vengriškas guliašas — tikra skonių jūra', shortTitle: 'Vengriškas guliašas',
    date: '2025-11-04', dateLabel: '2025 11 04', category: 'Troškiniai', image: 'recipe-goulash.jpg', width: 1200, height: 900,
    description: 'Lėtai troškinta jautiena su šonine, daržovėmis, bulvėmis ir sodriu vengriškos paprikos aromatu.',
    prep: '20–30 min.', cook: '2,5–3 val.', servings: '4',
    intro: 'Lėtas troškinys, kuriame susilieja jautienos sultingumas, šoninės kvapnumas, saldžiarūgštės daržovės ir sodrus paprikų aromatas. Kiekvienas žingsnis — nuo mėsos apvoliojimo miltuose iki ramaus troškinimo orkaitėje — kuria vientisą skonį.',
    ingredients: [['Troškiniui', ['150 g parūkytos kiaulienos šoninės', '1 kg MR. Ūkio guliašinės', '30 g miltų mėsai apvolioti', '2 dideli geltoni svogūnai', '3 didelės įvairių spalvų paprikos', '2 didelės morkos', '5 česnako skiltelės', '3 pomidorai', '1 arb. š. kmynų sėklų', '5 valg. š. vengriškos paprikos miltelių', '2 lauro lapai', '1–1,2 l jautienos sultinio', '3 vidutinės bulvės', '3 valg. š. šviežių petražolių', 'Druska ir pipirai']]],
    steps: [
      'Paruoškite mėsą: jei reikia, atitirpinkite šaldytuve ir prieš gaminimą palaikykite kambario temperatūroje.',
      'Jautieną supjaustykite maždaug 5 cm kubeliais, pagardinkite ir plonai apvoliokite miltuose. Orkaitę įkaitinkite iki 180 °C, o ant viryklės gerai įkaitinkite sunkų troškinimo puodą.',
      'Puode iškepkite šoninę, ją išimkite, o likusiuose riebaluose porcijomis apskrudinkite jautieną. Mėsos neperkraukite — gabalėliai turi skrusti, ne troškintis.',
      'Sumažinkite kaitrą. 8–10 minučių kepkite svogūnus, tada sudėkite paprikas ir morkas. Galiausiai trumpai pakepinkite česnaką bei kmynus. Įmaišykite pomidorus, grąžinkite mėsą ir šoninę, supilkite sultinį, sudėkite lauro lapus ir paprikos miltelius.',
      'Uždengtą puodą troškinkite 180 °C orkaitėje apie 2 valandas. Kai mėsa suminkštės, sudėkite bulves ir kepkite dar apie 20 minučių. Išimkite lauro lapus, įmaišykite petražoles ir prieš patiekdami leiskite 10 minučių pailsėti.'
    ]
  },
  {
    slug: 'sprandine-sous-vide',
    source: 'https://mrukis.lt/jautienos-sprandine-sous-vide-metodas-pavaldus-ne-tik-restorano-sefui/',
    title: 'Jautienos sprandinė sous vide', shortTitle: 'Sprandinė sous vide',
    date: '2025-10-07', dateLabel: '2025 10 07', category: 'Patarimai', image: 'recipe-sous-vide.jpg', width: 1200, height: 865,
    description: 'Tiksliai paruošta sous vide jautiena su sviestu, šalaviju, čiobreliais, grybais ir pomidorų bei burratos salotomis.',
    prep: '10 min.', cook: '2,5–3 val.', servings: '4',
    intro: 'Sous vide suteikia visišką kontrolę: mėsa iškepa tolygiai per visą storį, išlieka sultinga ir subtiliai kvepia žolelėmis. Tai restorano tikslumas, lengvai pasiekiamas namų virtuvėje.',
    ingredients: [
      ['Jautienai', ['~1 kg, 5–7 cm storio MR. Ūkio jautienos nugarinės arba sprandinės gabalas', 'Saujelė šviežių čiobrelių', 'Kelios šalavijo šakelės', '2 valg. š. sviesto', 'Jūros druska ir šviežiai malti pipirai', 'Vakuuminis maišelis']],
      ['Garnyrui', ['300–400 g enoki arba kitų mėgstamų grybų', '40 g sviesto', 'Druska ir pipirai', 'Keli lašai citrinų sulčių']],
      ['Salotoms', ['4–5 prinokę pomidorai', '1 burratos rutuliukas', 'Ypač tyras alyvuogių aliejus', 'Balzaminio acto kremas', 'Jūros druska, pipirai ir bazilikai']]
    ],
    steps: [
      'Mėsą, jei reikia, lėtai atitirpinkite šaldytuve ir prieš kepimą palaikykite kambario temperatūroje.',
      'Kepsnį nusausinkite, pagardinkite druska bei pipirais ir vakuumuokite su sviestu, šalavijais bei čiobreliais. Kepkite 55 °C vandens vonelėje arba sous vide režimą turinčioje orkaitėje 2,5–3 valandas.',
      'Mėsą išimkite iš maišelio ir labai gerai nusausinkite. Itin karštoje ketaus keptuvėje su sviestu ir trupučiu aliejaus apkepkite iš visų pusių po 30–45 sekundes. Uždengę folija pailsinkite 10–15 minučių.',
      'Grybus apkepkite svieste 3–4 minutes iš kiekvienos pusės, pagardinkite. Pomidorus supjaustykite, apšlakstykite aliejumi ir balzaminiu kremu, dėkite kambario temperatūros burratą. Patiekite su pjaustyta jautiena.'
    ]
  },
  {
    slug: 'mesainis-su-melynuoju-suriu',
    source: 'https://mrukis.lt/melynojo-pelesinio-surio-ir-jautienos-draugyste/',
    title: 'Mėlynojo pelėsinio sūrio ir jautienos draugystė', shortTitle: 'Mėsainis su mėlynuoju sūriu',
    date: '2025-08-07', dateLabel: '2025 08 07', category: 'Mėsainiai', image: 'recipe-blue-cheese.jpg', width: 1200, height: 900,
    description: 'Sultingas jautienos mėsainis su tirpstančiu mėlynojo pelėsinio sūrio branduoliu.',
    prep: '30 min.', cook: '20 min.', servings: '4',
    intro: 'Tai mėsainis su paslaptimi: sultingos jautienos viduje slypi tirpstantis mėlynojo pelėsinio sūrio branduolys. Intensyvus sūris, apskrudusi mėsa ir šviežios daržovės sukuria ryškų, gurmanišką derinį.',
    ingredients: [
      ['Paplotėliams', ['600 g smulkintos MR. Ūkio jautienos', '100 g mėlynojo pelėsinio sūrio', 'Druska ir pipirai', '1 arb. š. Vorčesterio padažo']],
      ['Padažui', ['Keli valg. š. majonezo', '1 arb. š. Vorčesterio padažo', '1 arb. š. tamsaus sojų padažo', 'Šiek tiek Tabasco padažo']],
      ['Kita', ['4 brioche tipo mėsainių bandelės', '4 riekės čederio arba goudos', 'Pomidoras', 'Salotų lapai', 'Raudonasis svogūnas']]
    ],
    steps: [
      'Mėsą atitirpinkite šaldytuve, jei reikia, ir prieš kepimą palaikykite kambario temperatūroje.',
      'Jautieną pagardinkite ir padalykite į 8 lygias dalis. Suformuokite plonus paplotėlius. Ant keturių dėkite mėlynojo sūrio, uždenkite likusiais ir sandariai užspauskite kraštus. Kepkite ant stipriai įkaitinto grilio arba keptuvėje po 4–5 minutes iš kiekvienos pusės.',
      'Bandeles perpjaukite ir paskrudinkite. Sumaišykite padažą ir juo patepkite apatinę bandelės pusę. Dėkite salotas, karštą įdarytą paplotėlį, pomidorą, svogūną ir viršutinę bandelę.',
      'Patiekite su gruzdintomis bulvytėmis arba daržovėmis. Dar sodresniam skoniui į paplotėlio vidų galima įdėti graikinių riešutų ar karamelizuotų svogūnų.'
    ]
  },
  {
    slug: 'mesainis-su-karamelizuotais-persikais',
    source: 'https://mrukis.lt/mesainis-su-karamelizuotais-persikais-skoniai-tikriems-maisto-romantikams/',
    title: 'Mėsainis su karamelizuotais persikais', shortTitle: 'Mėsainis su persikais',
    date: '2025-07-26', dateLabel: '2025 07 26', category: 'Mėsainiai', image: 'recipe-peach.jpg', width: 1080, height: 810,
    description: 'Vasariškas jautienos mėsainis su sūriu, balzaminiu glajumi ir karamelizuotais persikais.',
    prep: '30 min.', cook: '20 min.', servings: '4',
    intro: 'Čia susitinka sultinga jautiena, švelnus sūris ir karamelizuoti persikai. Balzaminis actas suteikia gilumo, čili dribsniai — žaismingo aštrumo, o visas derinys primena šiltą vasaros vakarą.',
    ingredients: [
      ['Paplotėliams', ['600 g smulkintos MR. Ūkio jautienos', 'Druska ir pipirai', '1 arb. š. Dižono garstyčių', '1 arb. š. Vorčesterio padažo']],
      ['Persikams', ['2 prinokę persikai', '1 valg. š. alyvuogių aliejaus arba sviesto', '1 valg. š. balzaminio acto', '1 arb. š. rudojo cukraus arba medaus', 'Žiupsnelis čili dribsnių', 'Šiek tiek druskos']],
      ['Padažui ir surinkimui', ['Keli valg. š. majonezo', 'Po 1 arb. š. Vorčesterio ir tamsaus sojų padažo', 'Šiek tiek Tabasco', '4 brioche tipo bandelės', '4 riekės goudos, mocarelos, brie arba burratos', 'Pomidoras ir salotų lapai']]
    ],
    steps: [
      'Mėsą, jei reikia, atitirpinkite šaldytuve ir prieš kepimą palaikykite kambario temperatūroje.',
      'Keptuvėje kaitinkite aliejų arba sviestą, suberkite cukrų. Kai ims karamelizuotis, sudėkite persikų skilteles, čili ir druską. Kepkite 2–3 minutes, supilkite balzaminį actą ir kaitinkite iki blizgaus glajaus.',
      'Jautieną sumaišykite su prieskoniais, garstyčiomis ir Vorčesterio padažu. Suformuokite 4 paplotėlius ir kepkite po 3–4 minutes iš kiekvienos pusės. Baigiant uždėkite sūrio ir leiskite jam išsilydyti.',
      'Bandeles paskrudinkite ir patepkite sumaišytu padažu. Dėkite salotas, karštą paplotėlį, karamelizuotus persikus, pomidorą ir viršutinę bandelę. Patiekite iš karto.'
    ]
  }
];

const esc = (value) => String(value).replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const list = (items) => `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;

function page(recipe) {
  const canonical = `https://graphicmeat.com/mrukis/receptai/${recipe.slug}`;
  const ingredients = recipe.ingredients.map(([heading, items]) => `<section class="ingredient-group"><h3>${esc(heading)}</h3>${list(items)}</section>`).join('');
  const steps = recipe.steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><p>${esc(step)}</p></li>`).join('');
  const schema = JSON.stringify({
    '@context':'https://schema.org','@type':'Recipe',name:recipe.title,image:`https://graphicmeat.com/assets/mrukis/${recipe.image}`,
    description:recipe.description,datePublished:recipe.date,recipeYield:'4 porcijos',prepTime:'PT30M',cookTime:'PT3H',
    recipeIngredient:recipe.ingredients.flatMap(([, items]) => items),recipeInstructions:recipe.steps.map((text) => ({'@type':'HowToStep',text})),
    author:{'@type':'Organization',name:'MR. Ūkis'},mainEntityOfPage:canonical
  });
  return `<!DOCTYPE html>
<html lang="lt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(recipe.title)} | MR. Ūkis</title><meta name="description" content="${esc(recipe.description)}"><meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(recipe.title)}"><meta property="og:description" content="${esc(recipe.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://graphicmeat.com/assets/mrukis/${recipe.image}"><meta property="article:published_time" content="${recipe.date}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(recipe.title)}"><meta name="twitter:description" content="${esc(recipe.description)}"><meta name="twitter:image" content="https://graphicmeat.com/assets/mrukis/${recipe.image}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"><link rel="stylesheet" href="/mrukis.css?v=4"><link rel="stylesheet" href="/mrukis-recipe.css?v=1"><script type="application/ld+json">${schema}</script></head>
<body class="inner-page recipe-page" data-locale="lt"><a class="skip-link" href="#main">Pereiti prie turinio</a><div class="announcement"><span>Receptas iš mūsų virtuvės</span><span class="announcement__mark">✦</span><span>Išbandyta su MR. Ūkio jautiena</span></div>
<header class="site-header"><a class="brand" href="/mrukis"><img src="/assets/mrukis/logo.png" alt="MR. Ūkis" width="458" height="483"></a><nav class="main-nav"><a href="/mrukis/parduotuve">Parduotuvė</a><a href="/mrukis/apie-mus">Apie mus</a><a href="/mrukis/renginiai">Renginiai</a><a href="/mrukis/receptai" aria-current="page">Receptai</a></nav><div class="header-actions"><a class="language" href="/en/mrukis/recipes">EN</a><button class="cart-trigger" data-cart-open>Krepšelis <span class="cart-count">0</span></button></div></header>
<main id="main"><article><header class="recipe-hero"><div class="recipe-hero__copy"><a class="recipe-back" href="/mrukis/receptai">← Visi receptai</a><p class="eyebrow"><time datetime="${recipe.date}">${recipe.dateLabel}</time> · ${esc(recipe.category)}</p><h1>${esc(recipe.title)}</h1><p>${esc(recipe.description)}</p><div class="recipe-facts"><div><span>Porcijos</span><strong>${recipe.servings}</strong></div><div><span>Pasiruošimas</span><strong>${recipe.prep}</strong></div><div><span>Gaminimas</span><strong>${recipe.cook}</strong></div></div></div><figure><img src="/assets/mrukis/${recipe.image}" alt="${esc(recipe.shortTitle)}" width="${recipe.width}" height="${recipe.height}"></figure></header>
<div class="recipe-content"><section class="recipe-intro" aria-labelledby="recipe-intro-title"><p class="eyebrow">Apie patiekalą</p><h2 id="recipe-intro-title">Skonis prasideda nuo gero produkto.</h2><p>${esc(recipe.intro)}</p></section><div class="recipe-columns"><aside class="ingredients" aria-labelledby="ingredients-title"><p class="eyebrow">Ko reikės</p><h2 id="ingredients-title">Ingredientai</h2>${ingredients}<a class="button button--dark" href="/mrukis/parduotuve">Rinktis jautieną →</a></aside><section class="method" aria-labelledby="method-title"><p class="eyebrow">Gaminimas</p><h2 id="method-title">Žingsnis po žingsnio</h2><ol>${steps}</ol></section></div><p class="recipe-source">Receptas adaptuotas iš <a href="${recipe.source}" target="_blank" rel="noopener noreferrer">originalaus MR. Ūkio recepto ↗</a></p></div></article>
<section class="inner-cta"><h2>Receptas prasideda<br><em>nuo gero pjausnio.</em></h2><a class="button button--light" href="/mrukis/parduotuve">Rinktis jautieną →</a></section></main>
<footer class="site-footer"><div class="footer-brand"><img src="/assets/mrukis/logo.png" alt="MR. Ūkis" width="458" height="483"><p>Receptai ir jautiena<br>tiesiai iš mūsų ūkio.</p></div><div><p class="footer-label">Atraskite</p><a href="/mrukis/apie-mus">Apie mus</a><a href="/mrukis/renginiai">Renginiai</a><a href="/mrukis/receptai">Receptai</a></div><div class="legal-links"><p class="footer-label">Teisinė informacija</p><a href="/mrukis/duk">DUK</a><a href="/mrukis/privacy-policy">Privatumo politika</a><a href="/mrukis/refund_returns">Pirkimo taisyklės</a></div><p class="copyright">© 2026 MR. Ūkis</p></footer>
<div class="cart-overlay" data-cart-overlay hidden></div><aside class="cart-drawer" data-cart-drawer aria-hidden="true"><div class="cart-head"><h2>Krepšelis <span class="cart-count">0</span></h2><button class="cart-close" data-cart-close aria-label="Uždaryti">×</button></div><div class="cart-items" data-cart-items></div><div class="cart-summary"><div><span>Suma</span><strong data-cart-total>0,00 €</strong></div><a class="checkout-button" href="/mrukis/parduotuve">Į parduotuvę →</a></div></aside><div class="toast" data-toast></div><script src="/mrukis.js?v=3" defer></script></body></html>`;
}

for (const recipe of recipes) {
  fs.writeFileSync(path.join(__dirname, '..', 'public', `mrukis-recipe-${recipe.slug}.html`), page(recipe));
}
