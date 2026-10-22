# De Slimste Gast — live quiz voor Visit Limburg

Gasten scannen een QR-code, geven hun naam in en antwoorden op hun gsm. Jij toont het presentatiescherm met vragen, weetjes, tussenstand en eindstand.

- **Spelers:** `https://<jouw-adres>/`
- **Presentator:** `https://<jouw-adres>/host` (vraagt de presentatorsleutel)

## Online zetten op Render (gratis, ±10 minuten)

1. **Zet de bestanden op GitHub.** Maak een account op github.com, klik op *New repository*, geef het de naam `de-slimste-gast` (privé mag) en klik op *Create*. Klik op *uploading an existing file* en sleep alle bestanden en de map `public` uit deze map naar het venster. Klik op *Commit changes*.
2. **Maak de webservice aan.** Ga naar render.com, meld je aan met je GitHub-account en kies *New → Web Service*. Selecteer de repository `de-slimste-gast`.
3. **Vul de instellingen in:**
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free` (of `Starter` voor de dag zelf, zie hieronder)
   - Environment Variables: voeg `HOST_KEY` toe met een eigen geheim woord. Dat is de sleutel voor het presentatiescherm. Zonder deze instelling is de sleutel `limburg`.
4. Klik op *Create Web Service*. Na een paar minuten krijg je een adres zoals `https://de-slimste-gast.onrender.com`.
5. Open `/host` op de laptop die aan de beamer hangt en geef je sleutel in. De QR-code verwijst automatisch naar het juiste adres.

## Op de dag zelf

- **Open het presentatiescherm 5 minuten vooraf.** Het gratis plan van Render valt in slaap na 15 minuten zonder bezoek en heeft dan even nodig om op te starten. Wil je dat risico niet, zet de service die dag op *Starter* (een paar dollar per maand, achteraf terug te zetten).
- **Test met twee gsm's** vóór de gasten binnenkomen. Klik daarna op *Opnieuw beginnen* zodat de testspelers verdwijnen.
- **Bediening:** spatie, pijltje rechts of Enter gaat naar de volgende stap. Een presenter-clicker werkt dus ook. Beweeg de muis om de knoppen te zien.
- **Verloop:** lobby → vraag (20 seconden) → antwoord en weetje → tussenstand → … → schiftingsvraag (30 seconden) → antwoord → eindstand. Een vraag sluit vanzelf als iedereen geantwoord heeft.
- **Punten:** 100 per juist antwoord. Bij gelijke stand wint wie het dichtst bij de schiftingsvraag zit.
- Wie zijn gsm vergrendelt of de pagina herlaadt, speelt gewoon verder met dezelfde naam.
- Herstart of update de server niet tijdens de quiz: de stand zit in het geheugen.

## Gastenpoll

Op dezelfde server draait ook een poll met drie vragen. Je hoeft niets extra online te zetten.

- **Deelnemers:** `https://<jouw-adres>/poll` (de QR-code staat op het presentatiescherm)
- **Presentator:** `https://<jouw-adres>/poll/host` (zelfde sleutel als de quiz)
- **Bediening:** pijltje rechts of spatie = volgende scherm, pijltje links = vorige. Wachtscherm → vraag 1 → vraag 2 → vraag 3 → overzicht.
- **Live resultaten:** antwoorden op vraag 1 verschijnen als kaartjes, vraag 2 en 3 als balken. Deelnemers gaan op hun gsm in hun eigen tempo door de drie vragen, met *Vorige* en *Volgende*, en kunnen hun antwoorden altijd nog aanpassen. Jij kiest los daarvan welke resultaten op het grote scherm staan.
- **Ongepast antwoord?** Beweeg de muis en klik op het kaartje om het te verbergen. Nog eens klikken toont het opnieuw.
- **Resultaten bewaren:** klik op *Exporteer (CSV)* vóór je de server stopt. Het bestand opent in Excel, met één rij per deelnemer.
- De vragen pas je aan bovenaan in `poll.js`.

## Aanpassen

- **Vragen, antwoorden en weetjes:** `questions.js`. Na een wijziging op GitHub zet Render de nieuwe versie automatisch online.
- **Tijd per vraag:** environment variable `QUESTION_SECONDS` (standaard 20) en `TIEBREAK_SECONDS` (standaard 30).
- **Kleuren:** `public/style.css`, op basis van het merkpaspoort (bronsgroen, blauw, lichtgroen, vlagrood, zand).

## Lokaal testen

Met Node.js 18 of nieuwer: `npm install` en dan `npm start`. Open `http://localhost:3000/host` (sleutel `limburg`). Gsm's op hetzelfde wifi-netwerk kunnen meedoen via het IP-adres van je laptop.

## Bronnen voor de vragen

- VRT NWS, *Voeren legt wandelpad aan naar hoogste punt van Vlaanderen* (31/03/2025)
- Wielerflits, *Hoogste punt van Vlaanderen ligt vlakbij Maastricht*
- Wikipedia, *Limburg mijn Vaderland*; Merkpaspoort Toerisme Limburg (bronsgroen eikenhout, Borgitter)
- Visit Limburg, *Waarom De Wijers zoveel vijvers heeft*
- Remembering my soldiers, *Hamont Dodendraad*
- The Brussels Times, *Hidden Belgium: Betty's Record Shop*; The Low Countries, *Genk Mines Its Own Business*
