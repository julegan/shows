# Original music priorities — source review, October 17, 2026

**Proposed additions: Julie reviews these through the pull request before publication.**

This pass adds **39 music dates: 37 live bills and two explicitly labeled goth DJ nights**, across nine places. The snapshot becomes 119 occurrences, including 65 music dates. No recurring market dates are added. Earlier events and stable IDs remain intact.

The research starts from the original underground metal, punk, goth, rock, hardcore, and DIY interests. [EDITORIAL.md](EDITORIAL.md) and [AGENTS.md](AGENTS.md) carry that priority into future work. Markets, learning, and community activities remain additional interests.

## Coverage

| Place | New dates |
| --- | ---: |
| AZØTH | 1 |
| High Limit Room | 3 |
| High Water Mark Lounge | 2 |
| Kenton Club | 1 |
| No Fun | 3 |
| Star Theater | 9 |
| The Coffin Club | 5 |
| Turn! Turn! Turn! | 6 |
| Twilight Cafe and Bar | 9 |

Music-style counts overlap on mixed bills; they are not separate event totals.

| Music style | New dates |
| --- | ---: |
| Goth & darkwave | 7 |
| Hardcore | 8 |
| Industrial & EBM | 9 |
| Metal | 7 |
| Noise & experimental | 2 |
| Post-punk | 4 |
| Punk | 17 |
| Rock | 8 |

## Verification and data handling

- Dated venue, promoter, official ticket, and artist pages verify the event year, date, location, and time. High Water Mark and Roman Candle ticket pages were available as indexed primary-source text while full pages blocked retrieval; that limit is recorded rather than attributed to an aggregator.
- Artist self-descriptions, artist-managed Bandcamp pages, labels, and venue descriptions support music styles. Styles are broad SHOWS browsing groups, separate from original source categories. Tags on a mixed bill may describe the identified headliner or support act; the evidence below names that basis.
- Two Church of Hive occurrences are DJ nights. Ritual Howls has live acts plus an included dance afterparty; it remains one event. No infinite weekly club recurrence is inferred.
- SPY/February and Sutekh Hexen publish doors only. `startTimeKind: "doors"` makes the time visibly say Doors; exports add `(doors)` to the event title and explain that performance start is unconfirmed. No secondary show time is substituted.
- All new end times remain unconfirmed. Existing exports use the disclosed editable one-hour placeholder. A venue curfew or calendar block is not a verified set finish.
- Missing prices use `free: null` and do not enter the confirmed-free filter. Missing event age restrictions remain unknown even when a venue has a general policy.
- AZØTH is listed by the promoter as Portland without a street address. No address is inferred and directions are not offered. High Limit access information comes from its own venue-info page.
- Shoot the Moon Fest groups only its four checked November 12–15 bills. The two checked Hive nights form a bounded series. Exports contain only those actual dates.

## Proposed dates

Times are Portland local time. Explicit offsets in `events.js` switch from PDT to PST on November 1.

| Date | Calendar time | Event | Place | Styles | Cost | Event source |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-18 | 20:30 | Antioch Arrow with At the Heart of the World & Nabiya | The Coffin Club | Hardcore, Punk | $18.59 advance including fees on official ticket page | [Primary listing](https://tickets.venuepilot.com/e/antioch-arrow-2026-10-18-the-coffin-portland-298f26) |
| 2026-10-18 | 21:00 | Church of Hive | Star Theater | Goth & darkwave, Industrial & EBM | $5 advertised cover; venue online listing $6.20 | [Primary listing](https://www.startheaterportland.com/tm-event/church-of-hive-8/) |
| 2026-10-19 | 19:00 | Veradas + Julie F the Rulies + Afraid of Women + Sertraline | High Limit Room | Rock | See organizer for current cost | [Primary listing](https://theveradas.com/home) |
| 2026-10-20 | 20:00 | Lioneer with Gavin Prophet, Drifter, Nervous State | Twilight Cafe and Bar | Punk, Rock | $15 | [Primary listing](https://twilightcafeandbar.com/event/466625/Lioneer-w-Gavin-Prophet-Drifter-Nervous-State) |
| 2026-10-21 | 20:30 | The Well, Pink Fuzz, Death Parade | High Water Mark Lounge | Metal, Rock | $20 advance / $25 at the door | [Primary listing](https://www.treetix.com/204790/highwatermark) |
| 2026-10-21 | 20:30 | Zanias with Vioflesh, Clubdrugs & Light Asylum (DJ set) | The Coffin Club | Industrial & EBM, Goth & darkwave | $24.77 advance including fees on official ticket page | [Primary listing](https://tickets.venuepilot.com/e/zanias-2026-10-21-the-coffin-portland-214887) |
| 2026-10-22 | 20:30 | Soraia, Star Chamber, The Hypnatwists | High Water Mark Lounge | Rock, Punk | $10 advance; check ticket provider for door price | [Primary listing](https://www.treetix.com/event?cal=highwatermark&id=204795) |
| 2026-10-23 | 20:00 | Liquid Cross + Collate + Pink Pollen | Turn! Turn! Turn! | Punk | See organizer for current cost | [Primary listing](https://app.opendate.io/e/liquid-cross-collate-pink-pollen-october-23-2026-779367) |
| 2026-10-23 | 20:30 | Ritual Howls with Grizz Cll & The Secret Light — Unholy Gathering | The Coffin Club | Goth & darkwave, Industrial & EBM, Post-punk | $23.74 advance including fees on official ticket page | [Primary listing](https://tickets.venuepilot.com/e/ritual-howls-2026-10-23-the-coffin-portland-c5036b) |
| 2026-10-24 | 19:30 | Terra's Birthday Show: Trans Panic, River City Ruin, Kids on Fire, The Immortal Dub CVNTS | Twilight Cafe and Bar | Punk | $12 | [Primary listing](https://twilightcafeandbar.com/event/466976/Terras-Birthday-Show-w-Trans-Panic-River-City-Ruin-Kids-on-Fire-SEA-The-Immortal-Dub-CVNTS-LA) |
| 2026-10-24 | 21:00 | Weird Rainbow + Little Hexes + Heirloom Monsters + Mask Appeal | Kenton Club | Rock | $10 cover | [Primary listing](https://littlehexes.com/) |
| 2026-10-25 | 19:00 | A Split-Second with Dancing Plague and Graveyard Gossip | Star Theater | Industrial & EBM | $18 advance / $25 day of show advertised; venue online listing $25.21 | [Primary listing](https://www.startheaterportland.com/tm-event/a-split-second/) |
| 2026-10-25 | 20:00 | Houkago Grind Time with Kostnateni, Biology, Skitzotoxin | Twilight Cafe and Bar | Metal | $15 | [Primary listing](https://twilightcafeandbar.com/event/466370/Houkago-Grind-Time-w-Kostnateni-Biology) |
| 2026-10-25 | 21:00 | Church of Hive | Star Theater | Goth & darkwave, Industrial & EBM | $5 advertised cover; venue online listing $6.20 | [Primary listing](https://www.startheaterportland.com/tm-event/church-of-hive-9/) |
| 2026-10-26 | 20:00 | Mania + Mnemonic Pulse + Andrew Black + DJ Music Medieval | Turn! Turn! Turn! | Noise & experimental, Industrial & EBM | See organizer for current cost | [Primary listing](https://app.opendate.io/e/mania-mnemonic-pulse-andrew-black-dj-music-medieval-october-26-2026-755388) |
| 2026-10-28 | 17:00 doors | SPY / FEBRUARY with Love Letter, Empty Shell Casing, Spite House, Soap Box Derby | High Limit Room | Hardcore, Punk | See organizer for current cost | [Primary listing](https://www.sosbookingandproduction.com/booking/2026/10/28/spy-february) |
| 2026-10-28 | 20:00 | CorMae + New Here + Combobox | Turn! Turn! Turn! | Punk | See organizer for current cost | [Primary listing](https://app.opendate.io/e/cormae-new-here-combobox-october-28-2026-749681) |
| 2026-10-31 | 20:00 | The Seditionists, Creatura, The Kieths | No Fun | Punk, Hardcore, Post-punk | $10 cash at the door | [Primary listing](https://www.nofunportland.com/events/the-seditionists-creatura-the-kieths) |
| 2026-11-05 | 20:00 | Carrión Kids + Cherry Cheeks + Amy Beth & Thee Creeps | Turn! Turn! Turn! | Punk | See organizer for current cost | [Primary listing](https://app.opendate.io/e/carrion-kids-cherry-cheeks-amy-beth-thee-creeps-november-05-2026-761324) |
| 2026-11-07 | 19:00 | Roman Candle + Postdrome + Asthelifeleavesyoureyes + XcaliberX | High Limit Room | Hardcore | $15 + fees | [Primary listing](https://aftontickets.com/event/buyticket/57jml3v89v) |
| 2026-11-07 | 20:00 | Exhumed with Jarhead Fertilizer, Savage Master & Molder | Star Theater | Metal | $29.33 venue listing | [Primary listing](https://www.startheaterportland.com/tm-event/exhumed-with-jarhead-fertilizer-savage-master-molder/) |
| 2026-11-07 | 20:00 | Iroiro (Seattle) + Blesst Chest + Trigger Object + Grapefruit | Turn! Turn! Turn! | Rock | See organizer for current cost | [Primary listing](https://app.opendate.io/e/iroiro-seattle-blesst-chest-trigger-object-grapefruit-november-07-2026-786227) |
| 2026-11-07 | 20:30 | Soft Vein with Modele & Chalice Sect | The Coffin Club | Goth & darkwave, Industrial & EBM | $17.56 advance including fees on official ticket page | [Primary listing](https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb?direct=true) |
| 2026-11-12 | 20:00 | Shoot the Moon Fest · Night 1: 1876, Last Thread, Altar Girl, Kids on Fire | Twilight Cafe and Bar | Punk | $20 | [Primary listing](https://twilightcafeandbar.com/event/467137/Shoot-the-Moon-Fest-Night-1-w-1876-w-Last-Thread-Altar-Girl-Kids-on-Fire) |
| 2026-11-13 | 20:00 | Shoot the Moon Fest · Night 2: Nox Novacula, Berzerk, Arcana, DJ Crash | Twilight Cafe and Bar | Goth & darkwave | $20 | [Primary listing](https://twilightcafeandbar.com/event/466439/Shoot-the-Moon-Fest-Night-2-w-Nox-Novacula-Berzerk-Arcana-Dj-Crash) |
| 2026-11-14 | 20:00 | Shoot the Moon Fest · Night 3: Goddamn Gallows, King Sickabilly, Beggars Canyon, John Dough Boys | Twilight Cafe and Bar | Punk | $20 | [Primary listing](https://twilightcafeandbar.com/event/466598/Shoot-the-Moon-Fest-Night-3-w-Goddamn-Gallows-King-Sickabilly-Beggars-Canyon-John-Dough-Boys) |
| 2026-11-14 | 20:00 doors | Sutekh Hexen + Sin Pavilion + Infinexhuma + Sam An + Messiah Claimant | AZØTH | Metal, Noise & experimental, Industrial & EBM | See organizer for current cost | [Primary listing](https://www.hierophantbooking.com/shows/sutekhpdx26) |
| 2026-11-14 | 20:00 | Under Utopia, Silver Shores, American Crows | No Fun | Rock | $10 cash at the door | [Primary listing](https://www.nofunportland.com/events/under-utopia-silver-shores-american-crows) |
| 2026-11-15 | 19:15 | Iron Chic with special guests | Star Theater | Punk | $27.27 venue listing | [Primary listing](https://www.startheaterportland.com/tm-event/iron-chic-with-special-guests/) |
| 2026-11-15 | 20:00 | Shoot the Moon Fest · Night 4: Los Mal Hablados, Chencha, Undisputed World Champion, Bill Skasby, Del Sol | Twilight Cafe and Bar | Hardcore, Punk | $20 | [Primary listing](https://twilightcafeandbar.com/event/467353/Shoot-the-Moon-Fest-Night-4-w-Los-Mal-Hablados-Chencha-Undisputed-World-Champion-Bill-Skasby-Del-Sol) |
| 2026-11-15 | 20:30 | Mobiius with Szara & Gnosiiis | The Coffin Club | Industrial & EBM | $23.74 advance including fees on official ticket page | [Primary listing](https://tickets.venuepilot.com/e/mobiius-2026-11-15-the-coffin-portland-5168da) |
| 2026-11-16 | 19:30 | Devil Master with PILAU & Cryr | Star Theater | Metal, Punk | $27.27 venue listing | [Primary listing](https://www.startheaterportland.com/tm-event/devil-master-with-pilau-guest/) |
| 2026-11-19 | 20:00 | Downstem album release with Impermanence, Wastelander, Witch Finger | Twilight Cafe and Bar | Hardcore, Punk | See organizer for current cost | [Primary listing](https://twilightcafeandbar.com/event/466781/Downstem-Album-Release-Show-w-Impermanence-Wastelander-Witch-Finger) |
| 2026-11-19 | 20:00 | HELL with Death Parade, Hope & Failure, Gethen and DJ Dirty Wizard | Star Theater | Metal | $24.18 venue listing | [Primary listing](https://www.startheaterportland.com/tm-event/hell-with-death-parade-hope-failure-gethen-and-dj-dirty-wizard/) |
| 2026-11-20 | 20:00 | Beta Voids + Byproxy + DJ Ben w/ Total Punk Souvenir Shop | Turn! Turn! Turn! | Punk, Hardcore, Post-punk, Rock | See organizer for current cost | [Primary listing](https://app.opendate.io/e/beta-voids-byproxy-dj-ben-w-total-punk-souvenir-shop-november-20-2026-780500) |
| 2026-11-20 | 20:00 | PRAYERS No Tengo Calma Tour 2026 featuring DEVORA and HALLOWS | Star Theater | Goth & darkwave, Post-punk | $37.57–$89.07 venue listing (range includes VIP option) | [Primary listing](https://www.startheaterportland.com/tm-event/prayers-no-tengo-calma-tour-2026-featuring-devora-hallows-and-chriz-amaya/) |
| 2026-11-22 | 18:00 | Psycroptic with Inferi, Cognitive & Summoning the Lich | Star Theater | Metal | $27.27 venue listing | [Primary listing](https://www.startheaterportland.com/tm-event/psycroptic-with-inferi-cognitive-summoning-the-lich/) |
| 2026-12-10 | 20:00 | Ignite with Year of the Cobra and guest | Twilight Cafe and Bar | Hardcore | $20 | [Primary listing](https://twilightcafeandbar.com/event/467469/Ignite-w-Year-of-the-Cobra-Guest) |
| 2026-12-10 | 20:00 | Sang Bleu with support TBA | No Fun | Punk | $10 cash at the door | [Primary listing](https://www.nofunportland.com/events/sang-bleu-tba-tba) |

## Genre evidence and review notes

The source links below establish artist identity and genre context, rather than claiming every supporting act plays the same style. Original source category fields remain separate.

### Antioch Arrow with At the Heart of the World & Nabiya — 2026-10-18

Label Three One G describes Antioch Arrow's early albums as having a classic hardcore feel. Official venue ticketed bill verified. [Reference 1](https://threeoneg.com/artists/antioch-arrow)

### Church of Hive — 2026-10-18

Venue description explicitly calls it a gothic, industrial and darkwave dance party. [Reference 1](https://www.startheaterportland.com/tm-event/church-of-hive-8/)

### Veradas + Julie F the Rulies + Afraid of Women + Sertraline — 2026-10-19

Veradas official bio describes a fuzz-driven psych rock trio with shoegaze and krautrock influences. [Reference 1](https://www.bandsintown.com/e/108803508) · [Reference 2](https://highlimitroompdx.com/info/)

### Lioneer with Gavin Prophet, Drifter, Nervous State — 2026-10-20

Lioneer's own Bandcamp bio describes anthemic power-pop continuing early-2000s pop-punk/emo. [Reference 1](https://lioneer.bandcamp.com/)

### The Well, Pink Fuzz, Death Parade — 2026-10-21

The Well's label RidingEasy describes early-1970s doom/heavy psych and noise-rock influences. [Reference 1](https://www.ridingeasyrecs.com/product-category/bands/the-well-bands/) · [Reference 2](https://pinkfuzz.bandcamp.com/)

The ticket provider lists 8 PM doors / 8:30 PM show. Some secondary listings give 7 PM. Primary ticket text was available through the search index; the full page was blocked.

### Zanias with Vioflesh, Clubdrugs & Light Asylum (DJ set) — 2026-10-21

Zanias official music page describes post-industrial ethereal wave; artist's own Bandcamp tags darkwave, EBM and industrial. [Reference 1](https://www.zanias-music.com/music) · [Reference 2](https://zanias.bandcamp.com/album/to-the-core-10-year-anniversary-edition)

The dated venue ticket and artist event feed give October 21; a label tour page gives November 21. This entry follows the dated venue ticket. Confirm with the organizer.

### Soraia, Star Chamber, The Hypnatwists — 2026-10-22

Soraia's own bio describes garage rock and alternative; own Bandcamp release tags include garage punk and garage rock. [Reference 1](https://www.soraia.com/about-us) · [Reference 2](https://soraia.bandcamp.com/album/confessions-from-the-vena-cava)

The ticket provider lists 8 PM doors / 8:30 PM show. Some secondary listings give 7 PM. Primary ticket text was available through the search index; the full page was blocked.

### Liquid Cross + Collate + Pink Pollen — 2026-10-23

Liquid Cross official Bandcamp/label bio calls the band punk from Eugene. Post-punk for Collate was supported by secondary local music reporting; use Punk alone if requiring primary genre labels. [Reference 1](https://liquidcross.bandcamp.com/album/dont-think-ep) · [Reference 2](https://strangemono.com/liquid-cross/)

### Ritual Howls with Grizz Cll & The Secret Light — Unholy Gathering — 2026-10-23

Official ticket page describes goth, industrial and darkwave dance party following live bands; Ritual Howls official site describes post-punk and industrial music. [Reference 1](https://ritualhowls.com/)

### Terra's Birthday Show: Trans Panic, River City Ruin, Kids on Fire, The Immortal Dub CVNTS — 2026-10-24

Trans Panic self-describes as an unapologetically queer punk band on its own Bandcamp page. [Reference 1](https://transpanicpunk.bandcamp.com/album/songs-for-tranarchists)

### Weird Rainbow + Little Hexes + Heirloom Monsters + Mask Appeal — 2026-10-24

Little Hexes official site describes itself as a rock band and art pop; genre art rock is editorial classification. This is a lower-priority rock choice, not a metal/hardcore substitute. [Reference 1](https://www.kentonclub.com/)

### A Split-Second with Dancing Plague and Graveyard Gossip — 2026-10-25

Marc Ickx/A Split-Second official Bandcamp tags E.B.M. and industrial. [Reference 1](https://marcickxasplit-second.bandcamp.com/album/a-split-second-ep-remastered-2023)

### Houkago Grind Time with Kostnateni, Biology, Skitzotoxin — 2026-10-25

Primary artist interview: Andrew Lee calls Houkago's music grindcore, and his style mincecore/goregrind. His own Bandcamp lists the Twilight Oct25 show. [Reference 1](https://houkagogrindtime2.bandcamp.com/album/sorry-i-am-not-from-japan) · [Reference 2](https://echoesanddust.com/2024/08/andrew-lee-from-houkago-grind-time/)

### Church of Hive — 2026-10-25

Venue description explicitly calls it a gothic, industrial and darkwave dance party. [Reference 1](https://www.startheaterportland.com/tm-event/church-of-hive-9/)

### Mania + Mnemonic Pulse + Andrew Black + DJ Music Medieval — 2026-10-26

Mnemonic Pulse official Bandcamp tags Altair dark synth, ambient, post-industrial, space drone. Mania identity is not linked by the event page, so do not automatically assign black metal from the same-name Portland artist. [Reference 1](https://mnemonicpulse.bandcamp.com/album/altair)

### SPY / FEBRUARY with Love Letter, Empty Shell Casing, Spite House, Soap Box Derby — 2026-10-28

SPY official Bandcamp describes Bay Area hardcore punk. [Reference 1](https://aftontickets.com/spy) · [Reference 2](https://spyhc.bandcamp.com/) · [Reference 3](https://highlimitroompdx.com/shows/)

Calendar time is doors. The show start is unconfirmed.

### CorMae + New Here + Combobox — 2026-10-28

CorMae official Bandcamp tags garage-punk, egg-punk, punk-rock, riot-grrrl; artist describes itself as a garage/punk band from Austin. [Reference 1](https://cormae.bandcamp.com/album/everything-is-so-great)

### The Seditionists, Creatura, The Kieths — 2026-10-31

The Seditionists' own Politricks release tags punk, hardcore and post-punk; don't apply these tags as specific claims about all supporting acts. [Reference 1](https://theseditionists.bandcamp.com/album/politricks)

### Carrión Kids + Cherry Cheeks + Amy Beth & Thee Creeps — 2026-11-05

Carrion Kids official Bandcamp identifies Mexico City Punk; garage qualifier is supported by their official Linktree linking interviews but Punk alone is safest primary label. [Reference 1](https://carrionkids.bandcamp.com/)

### Roman Candle + Postdrome + Asthelifeleavesyoureyes + XcaliberX — 2026-11-07

Roman Candle label Sumerian describes Las Vegas hardcore and screamo. [Reference 1](https://sumerianrecords.com/collections/roman-candle) · [Reference 2](https://embed-list.aftontickets.com/events/7b6b6d028dabac2aebba5acdff518c91/list)

### Exhumed with Jarhead Fertilizer, Savage Master & Molder — 2026-11-07

Exhumed's label Relapse calls the group deathgrind on Red Asphalt page and death metal on Horror release page. [Reference 1](https://www.relapse.com/pages/exhumed-red-asphalt) · [Reference 2](https://www.relapse.com/products/exhumed-horror-cd)

### Iroiro (Seattle) + Blesst Chest + Trigger Object + Grapefruit — 2026-11-07

Iroiro official album Bandcamp tags rock, instrumental, psychedelic, shoegaze, space rock; official site calls them instrumental Seattle band. [Reference 1](https://iroiroband.bandcamp.com/album/iroiro-s-t) · [Reference 2](https://iroiro.band/)

### Soft Vein with Modele & Chalice Sect — 2026-11-07

Artist's booking agency Persona Grata explicitly describes darkwave solo project blending cold wave and industrial. [Reference 1](https://personagrataagency.com/artists/soft-vein/)

### Shoot the Moon Fest · Night 1: 1876, Last Thread, Altar Girl, Kids on Fire — 2026-11-12

1876 calls itself Indigenous punk rock on its own Bandcamp; release tags include punk rock, ska punk and skate punk. [Reference 1](https://1876band.bandcamp.com/album/pow-wow-punk-rock-iiii)

### Shoot the Moon Fest · Night 2: Nox Novacula, Berzerk, Arcana, DJ Crash — 2026-11-13

Nox Novacula's label Artoffact explicitly identifies the band as deathrock and discusses gothic rock. [Reference 1](https://artoffact.com/artists/nox-novacula/)

### Shoot the Moon Fest · Night 3: Goddamn Gallows, King Sickabilly, Beggars Canyon, John Dough Boys — 2026-11-14

The Goddamn Gallows' own biography identifies punk rock, psychobilly and americana-punk elements. [Reference 1](https://www.thegoddamngallows.com/bio)

### Sutekh Hexen + Sin Pavilion + Infinexhuma + Sam An + Messiah Claimant — 2026-11-14

Sutekh Hexen official Bandcamp calls their music experimental black metal; tags black metal, harsh noise, power electronics. [Reference 1](https://sutekhhexen.bandcamp.com/album/primeval)

Calendar time is doors. The show start is unconfirmed. The promoter lists Portland but no street address. Ask the organizer for location and arrival details.

### Under Utopia, Silver Shores, American Crows — 2026-11-14

Under Utopia's own All Pets Die track tags alternative rock, indie rock and rock. [Reference 1](https://underutopia.bandcamp.com/track/all-pets-die)

### Iron Chic with special guests — 2026-11-15

Official Iron Chic Bandcamp describes The Constant One as melodic punk and supplies DIY punk tags. [Reference 1](https://ironchic.bandcamp.com/album/the-constant-one)

### Shoot the Moon Fest · Night 4: Los Mal Hablados, Chencha, Undisputed World Champion, Bill Skasby, Del Sol — 2026-11-15

Los Mal Hablados' official Linktree identifies Portland Latin Skacore; band's official site image reads PDX Latin Hardcore. [Reference 1](https://linktr.ee/losmalhabladospdx) · [Reference 2](https://losmalhabladospdx.com/)

### Mobiius with Szara & Gnosiiis — 2026-11-15

Mobiius' own Bandcamp bio explicitly says dark industrial dance music. [Reference 1](https://mobiiusmusic.bandcamp.com/music)

### Devil Master with PILAU & Cryr — 2026-11-16

Official Relapse release page describes black metal and punk; Devil Master's own Bandcamp tags black metal, blackened crust and punk. [Reference 1](https://www.startheaterportland.com/) · [Reference 2](https://devilmaster.bandcamp.com/album/bloody-dreams) · [Reference 3](https://www.relapse.com/pages/devil-master-bloody-dreams) · [Reference 4](https://linktr.ee/devilisyourmaster)

### Downstem album release with Impermanence, Wastelander, Witch Finger — 2026-11-19

Support act Impermanence's own Bandcamp says two-piece hardcore from Portland, with punk, hardcore punk and powerviolence tags. Downstem's stoner-doom classification appeared only in weak/reposted sources and isn't used here. [Reference 1](https://impermanencepdx.bandcamp.com/album/8-song-eulogy)

Hardcore and powerviolence tags describe the verified support act Impermanence; the headliner genre is not inferred.

### HELL with Death Parade, Hope & Failure, Gethen and DJ Dirty Wizard — 2026-11-19

Official Ticketmaster event discovery indexes this bill under metal; label Sentient Ruin describes Salem HELL as sludge/doom, but event page does not link the artist identity, so broad Metal is safest. [Reference 1](https://www.ticketmaster.com/discover/portland?categoryId=KZFzniwnSyZfZ7v7nJ&classificationId=KnvZfZ7vAvt&tt_scene=anchor_view) · [Reference 2](https://sentientruin.com/releases/hell-hell-i)

Broad metal classification follows the official ticketing category; no unverified band biography or subgenre is assigned.

### Beta Voids + Byproxy + DJ Ben w/ Total Punk Souvenir Shop — 2026-11-20

Beta Voids official Bandcamp tags punk, alternative-rock, garage, hardcore, hardcore punk, post-punk, punk rock; event says Presented by TOTAL PUNK. [Reference 1](https://betavoids.bandcamp.com/album/scrape-it-off)

### PRAYERS No Tengo Calma Tour 2026 featuring DEVORA and HALLOWS — 2026-11-20

PRAYERS' official ticket/venue bio at Magic Bag identifies cholo-goth electronic; support act HALLOWS official Bandcamp tags darkwave and postpunk. [Reference 1](https://www.themagicbag.com/concerts-magicbag/prayers) · [Reference 2](https://hallows.bandcamp.com/album/dream) · [Reference 3](https://linktr.ee/CHOLOGOTH) · [Reference 4](https://www.ticketweb.com/event/prayers-no-tengo-calma-tour-star-theater-tickets/15016043)

### Psycroptic with Inferi, Cognitive & Summoning the Lich — 2026-11-22

Official artist site is titled Psycroptic | Tasmanian Death Metal and separately confirms Nov22 Portland Star Theatre tour stop. [Reference 1](https://www.psycroptic.com/)

### Ignite with Year of the Cobra and guest — 2026-12-10

Ignite's official website identifies melodic hardcore in its reposted promotion and hardcore throughout its bio/announcements; same site announces theDec10PortlandTwilightdate with Year of the Cobra. [Reference 1](https://www.ignitebandofficial.com/)

### Sang Bleu with support TBA — 2026-12-10

Sang Bleu's own EGOS page calls its music doomy dance punk and tags punk. [Reference 1](https://sangbleupdx.bandcamp.com/album/egos)

## Existing bills made easier to find

Sixteen existing records receive evidence-backed style metadata and clearer subtitles; they are not added a second time. Five other existing music records map their already reviewed genre tags into the same broad filters.

| Existing event ID | Browsing styles | Evidence |
| --- | --- | --- |
| dantes-true-fear-2026-11-05 | Hardcore, Punk | Dante's genre archive explicitly includes this bill. [Reference](https://www.danteslive.com/tm_genre/hardcore-punk/) |
| dantes-deathtape-2026-11-12 | Hardcore, Punk | Dante's genre archive explicitly includes Deathtape. [Reference](https://www.danteslive.com/tm_genre/hardcore-punk/) |
| dantes-comeback-kid-2026-11-18 | Hardcore, Punk | SharpTone describes Comeback Kid as punk and hardcore. [Reference](https://sharptonerecords.co/collections/comeback-kid) |
| dantes-metal-church-2026-11-13 | Metal | Metal Church official bio identifies the band as heavy metal. [Reference](https://metalchurchofficial.com/home) |
| dantes-jon-spencer-2026-11-10 | Rock, Punk | Artist release page describes garage punk and rock and roll. [Reference](https://jonspencer.bandcamp.com/album/songs-of-personal-loss-and-protest-2) |
| dantes-distant-2026-11-24 | Metal | Distant's own Bandcamp identifies downtempo / deathcore. [Reference](https://distantofficial.bandcamp.com/music) |
| hawthorne-christian-death-2026-11-17 | Goth & darkwave | Season of Mist identifies Christian Death as gothic and death rock. [Reference](https://www.season-of-mist.com/bands/christian-death/) |
| hawthorne-fear-factory-2026-11-21 | Metal, Industrial & EBM | Nuclear Blast describes Fear Factory as industrial metal. [Reference](https://www.nuclearblast.com/blogs/news/fear-factory-unleashes-machine-driven-new-single-roboticist) |
| hawthorne-pain-of-truth-2026-10-30 | Hardcore, Punk | DAZE artist release supplies hardcore and hardcore punk tags. [Reference](https://dazestyle.bandcamp.com/album/not-through-blood) |
| hawthorne-static-dress-2026-11-13 | Hardcore, Punk, Rock | Artist Bandcamp tags post-hardcore, punk and post-rock; Hardcore is the broader browsing group. [Reference](https://staticdress.bandcamp.com/) |
| hawthorne-kingdom-of-giants-2026-11-15 | Metal, Hardcore | SharpTone describes modern metal and post-hardcore roots. [Reference](https://sharptonerecords.co/collections/kingdom-of-giants) |
| hawthorne-miss-may-i-born-of-osiris-2026-12-08 | Metal | SharpTone describes Miss May I's metalcore background. [Reference](https://sharptonerecords.co/collections/miss-may-i) |
| hawthorne-amorphis-insomnium-2026-12-01 | Metal | Venue lists this bill in Metal/Hardcore; SHOWS uses broad Metal. [Reference](https://hawthornetheatre.com/event-genres/metal-hardcore/) |
| hawthorne-bodysnatcher-2026-11-27 | Metal | Venue lists this bill in Metal/Hardcore; SHOWS uses broad Metal. [Reference](https://hawthornetheatre.com/event-genres/metal-hardcore/) |
| hawthorne-suicide-silence-2026-12-09 | Metal | Nuclear Blast describes Suicide Silence's deathcore sound. [Reference](https://www.nuclearblast.com/pages/suicide-silence) |
| hawthorne-bear-ghost-2026-10-21 | Rock | Bear Ghost's official site identifies the band as adventure rock. [Reference](https://www.bearghost.com/) |

## Held back and source gaps

- **Black Water / Habak, November 7:** Doomtown and another discovery calendar have a fitting bill, but direct venue, artist, or official ticket confirmation could not be obtained. Keep this as a review lead. The venue has moved; do not reuse its old Broadway address.
- **Black Water / Iron Lung:** the discovery guide gives an October 26 date with an incompatible weekday. No date is chosen from that conflict.
- **Coffin / Halloween Eve, October 30:** the ticket page gives doors after showtime and another description gives a different start. Held for timing clarification.
- **Coffin / Ayria, November 24:** ticket, artist, and support-act times differ. Held for clarification rather than treating the ticket field as an established performance time.
- **Star / Hive November 1 and 8:** the homepage dates conflict with linked detail pages showing July dates. Only October 18 and 25 are included.
- **Zanias, October 21:** the dated venue ticket and artist-managed event feed agree; a label page gives November 21. The included October entry exposes that conflict and does not create the unsupported second date.
- **Twilight / Atomic Rule:** advertised lineup/status requires current organizer confirmation. A stale venue listing alone is insufficient; no cancellation is asserted.
- **No Fun / November 13:** overlapping venue listings may represent a replacement; held until the venue clarifies. Void Lord December 11 remains a promising lead with event details but insufficient primary genre evidence.
- **High Water Mark:** two October bills have indexed primary ticket evidence, with explicit 8 PM doors / 8:30 PM show. Some aggregators say 7 PM; the entries follow the primary ticket provider. Later HWM coverage remains incomplete.
- **High Limit:** Oso Oso lacks a verified primary start time in the retrieved text; Big Ass Truck has conflicting secondary times and insufficient primary details. These are follow-up leads, not confirmed calendar entries.
- **Kenton:** one artist-confirmed October 24 bill is included. Other fitting venue listings lack an explicit year or time in accessible primary text.
- **Shanghai Tunnel and Soundcontrol:** readable direct inventory was insufficient. No events are invented to imply those sources are covered.
- **The Fixin’ To:** its current official show page says no events. Old listings are not treated as a current calendar.
- **Bossanova / Nova PDX:** no fitting live underground bill was verified in the checked calendar. Generic house/EDM is not used to fill the gap.
- Verified Halloween tribute bills and a few lower-priority indie leads remain outside this batch. The new listings emphasize original bills.

[EVENT-SOURCES.md](EVENT-SOURCES.md) preserves the earlier 69-occurrence expansion and its unresolved leads. This is a manually maintained snapshot, not a completeness claim or cancellation-monitoring service.
