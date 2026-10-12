// De Slimste Gast — vragen
// Pas hier vragen, antwoorden en weetjes aan. `correct` is de index van het juiste antwoord (0 = eerste).
// type: "mc" (meerkeuze) of "tf" (juist/fout). De schiftingsvraag staat onderaan apart.

module.exports = {
  questions: [
    {
      type: "mc",
      text: "Waar ligt het hoogste punt van Belgisch Limburg?",
      options: [
        "Op de Kemmelberg",
        "Op de Reesberg in Remersdaal (Voeren)",
        "Op de terril van Winterslag",
        "Op de Sint-Pietersberg",
      ],
      correct: 1,
      fact:
        "De Reesberg is meteen ook het hoogste punt van heel Vlaanderen. Hij ligt amper twee meter van de taalgrens. De Kemmelberg ligt in West-Vlaanderen, de Sint-Pietersberg in Nederlands Limburg.",
    },
    {
      type: "tf",
      text: "Voeren grenst nergens aan de rest van Belgisch Limburg.",
      options: ["Juist", "Fout"],
      correct: 0,
      fact:
        "Voeren ligt ingeklemd tussen Nederland en Wallonië. Wie er vanuit Hasselt naartoe rijdt, passeert altijd via Nederland of de provincie Luik. Sinds 1963 hoort Voeren bij Limburg.",
    },
    {
      type: "mc",
      text: "Wat klopt er over het volkslied ‘Limburg mijn Vaderland’?",
      options: [
        "Het is enkel het volkslied van Belgisch Limburg",
        "Het is het officiële volkslied van Belgisch én Nederlands Limburg",
        "Het werd geschreven na de splitsing van Limburg in 1839",
        "Het werd oorspronkelijk in het Frans geschreven",
      ],
      correct: 1,
      fact:
        "Gerard Krekelberg schreef de tekst in 1909, Henri Tijssen de muziek. Het ‘bronsgroen eikenhout’ zag Krekelberg aan kasteel Borgitter in Kessenich. De laatste strofe, over het Huis van Oranje, wordt in België nooit gezongen.",
    },
    {
      type: "tf",
      text: "De naam Limburg komt van het stadje Limbourg in het Land van Herve.",
      options: ["Juist", "Fout"],
      correct: 0,
      fact:
        "Limbourg aan de Vesder was het centrum van het oude hertogdom Limburg. Onze provincie hoorde daar grotendeels níét bij: koning Willem I gaf haar die naam in 1815, om de historische titel levend te houden.",
    },
    {
      type: "mc",
      text: "Hoe zijn de vele vijvers van De Wijers ontstaan?",
      options: [
        "Restanten van één groot ijstijdmeer",
        "Ze werden aangelegd voor de viskweek",
        "Bij de aanleg van het Albertkanaal",
        "Door verzakkingen van de mijnbouw",
      ],
      correct: 1,
      fact:
        "Al in de 12de en 13de eeuw moedigden de abdijen de viskweek aan. ‘Wijer’ betekent visvijver. In 1865 werd Antoon Bijnens uit Zonhoven de eerste commerciële viskweker.",
    },
    {
      type: "mc",
      text: "Waarom werden er massaal dennenbossen aangeplant in de Limburgse Kempen?",
      options: [
        "Als windscherm voor de landbouw",
        "Voor stuthout in de steenkoolmijnen",
        "Voor de papierindustrie",
        "Om het grondwater op peil te houden",
      ],
      correct: 1,
      fact:
        "Grove den groeit snel op arme zandgrond. En het hout kraakt hoorbaar vóór het breekt: een levensreddend alarm voor de mijnwerkers ondergronds.",
    },
    {
      type: "tf",
      text: "Tijdens de Eerste Wereldoorlog liep er langs de grens met Nederland, ook in Limburg, een elektrische draad van zo’n 2.000 volt.",
      options: ["Juist", "Fout"],
      correct: 0,
      fact:
        "De Duitsers bouwden de ‘Dodendraad’ tegen smokkelaars, spionnen en vluchtelingen. Smokkelaars kropen er toch door met geïsoleerde houten ramen en rubberen handschoenen. Herdenkingsplekken vind je onder meer in Hamont.",
    },
    {
      type: "mc",
      text: "Welke Genkse straat was het hart van de culturele mix uit de mijncités, en de springplank voor Rocco Granata?",
      options: ["Stalenstraat", "Vennestraat", "Hasseltweg", "Molenstraat"],
      correct: 1,
      fact:
        "In de platenzaak van Betty Peeters, Vennestraat 199, lag ‘Marina’ als eerste in de winkel: zij kocht meteen 25 platen. Het lied ging later meer dan 100 miljoen keer over de toonbank.",
    },
  ],

  tiebreak: {
    text: "Hoe hoog is het hoogste punt van Belgisch Limburg?",
    unit: "meter",
    answer: 289.42,
    fact: "De Reesberg in Remersdaal piekt op 289,42 meter. Oudere bronnen spreken nog van 287 à 288 meter.",
  },
};
