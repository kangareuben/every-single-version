// Second genre-diverse pass, filling gaps list 5 left untouched: country,
// hip-hop/R&B deep cuts, disco/funk, 80s synth-pop/new wave, punk/pop-
// punk/emo, folk/blues/bluegrass, reggae/dancehall, Bollywood, Afrobeats,
// patriotic standards, big band/swing, and 90s grunge/alt rock. Same
// criterion as list 5 (cover/version volume, not chart-verified), same
// "year" convention (release year, or first major recording for a
// standard with no single release). Overlap with other lists is fine,
// alreadySeeded() in seed.mts skips duplicates for free.
export interface SeedSong {
  year: number;
  song: string;
  artist: string;
}

export const SEED_SONGS_6: SeedSong[] = [
  // Country — huge cover/karaoke/wedding ecosystem of its own.
  { year: 1974, song: "Jolene", artist: "Dolly Parton" },
  { year: 1981, song: "9 to 5", artist: "Dolly Parton" },
  { year: 1990, song: "Friends in Low Places", artist: "Garth Brooks" },
  { year: 1992, song: "I Will Always Love You", artist: "Whitney Houston" },
  { year: 2002, song: "Picture to Burn", artist: "Taylor Swift" },
  { year: 2006, song: "Before He Cheats", artist: "Carrie Underwood" },
  { year: 2008, song: "Jesus, Take the Wheel", artist: "Carrie Underwood" },
  { year: 2011, song: "Need You Now", artist: "Lady Antebellum" },
  { year: 2013, song: "Cruise", artist: "Florida Georgia Line" },
  { year: 2015, song: "Humble and Kind", artist: "Tim McGraw" },
  { year: 2017, song: "Body Like a Back Road", artist: "Sam Hunt" },
  { year: 2019, song: "The Bones", artist: "Maren Morris" },
  { year: 1975, song: "Rhinestone Cowboy", artist: "Glen Campbell" },
  { year: 1981, song: "Islands in the Stream", artist: "Kenny Rogers" },

  // Hip-hop / rap deep cuts — barely touched by the other lists.
  { year: 1979, song: "Rapper's Delight", artist: "The Sugarhill Gang" },
  { year: 1988, song: "Straight Outta Compton", artist: "N.W.A" },
  { year: 1993, song: "C.R.E.A.M.", artist: "Wu-Tang Clan" },
  { year: 1994, song: "Juicy", artist: "The Notorious B.I.G." },
  { year: 1996, song: "California Love", artist: "2Pac" },
  { year: 1998, song: "Hypnotize", artist: "The Notorious B.I.G." },
  { year: 1999, song: "Still D.R.E.", artist: "Dr. Dre" },
  { year: 2003, song: "In da Club", artist: "50 Cent" },
  { year: 2004, song: "Lose Yourself", artist: "Eminem" },
  { year: 2011, song: "Sail", artist: "AWOLNATION" },
  { year: 2015, song: "Alright", artist: "Kendrick Lamar" },
  { year: 2018, song: "God's Plan", artist: "Drake" },
  { year: 2018, song: "Sicko Mode", artist: "Travis Scott" },

  // R&B deep cuts.
  { year: 1992, song: "End of the Road", artist: "Boyz II Men" },
  { year: 1996, song: "No Diggity", artist: "Blackstreet" },
  { year: 1998, song: "No Scrubs", artist: "TLC" },
  { year: 2000, song: "Say My Name", artist: "Destiny's Child" },
  { year: 2003, song: "Crazy in Love", artist: "Beyonce" },
  { year: 2006, song: "Hips Don't Lie", artist: "Shakira" },
  { year: 2010, song: "Bad Romance", artist: "Lady Gaga" },
  { year: 2016, song: "Formation", artist: "Beyonce" },

  // Disco / funk — standards at every wedding/party cover band's core.
  { year: 1976, song: "You Should Be Dancing", artist: "Bee Gees" },
  { year: 1977, song: "Stayin' Alive", artist: "Bee Gees" },
  { year: 1978, song: "Le Freak", artist: "Chic" },
  { year: 1979, song: "I Will Survive", artist: "Gloria Gaynor" },
  { year: 1979, song: "Good Times", artist: "Chic" },
  { year: 1980, song: "Funkytown", artist: "Lipps Inc." },
  { year: 1970, song: "Get Up (I Feel Like Being a) Sex Machine", artist: "James Brown" },
  { year: 1976, song: "Play That Funky Music", artist: "Wild Cherry" },
  { year: 1978, song: "Boogie Wonderland", artist: "Earth, Wind & Fire" },
  { year: 1978, song: "September", artist: "Earth, Wind & Fire" },

  // 80s synth-pop / new wave.
  { year: 1981, song: "Don't You Want Me", artist: "The Human League" },
  { year: 1982, song: "Come On Eileen", artist: "Dexys Midnight Runners" },
  { year: 1983, song: "Every Breath You Take", artist: "The Police" },
  { year: 1983, song: "Sweet Dreams (Are Made of This)", artist: "Eurythmics" },
  { year: 1984, song: "Take On Me", artist: "a-ha" },
  { year: 1984, song: "Girls Just Want to Have Fun", artist: "Cyndi Lauper" },
  { year: 1985, song: "Don't You (Forget About Me)", artist: "Simple Minds" },
  { year: 1986, song: "True Colors", artist: "Cyndi Lauper" },
  { year: 1981, song: "Tainted Love", artist: "Soft Cell" },
  { year: 1982, song: "Just Can't Get Enough", artist: "Depeche Mode" },

  // Punk / pop-punk / emo.
  { year: 1977, song: "Blitzkrieg Bop", artist: "Ramones" },
  { year: 1977, song: "God Save the Queen", artist: "Sex Pistols" },
  { year: 1994, song: "Basket Case", artist: "Green Day" },
  { year: 1997, song: "The Kids Aren't Alright", artist: "The Offspring" },
  { year: 2000, song: "All the Small Things", artist: "blink-182" },
  { year: 2003, song: "In the End", artist: "Linkin Park" },
  { year: 2004, song: "American Idiot", artist: "Green Day" },
  { year: 2005, song: "I Write Sins Not Tragedies", artist: "Panic! at the Disco" },
  { year: 2005, song: "Welcome to the Black Parade", artist: "My Chemical Romance" },
  { year: 2006, song: "Dirty Little Secret", artist: "The All-American Rejects" },

  // Folk / blues / bluegrass.
  { year: 1967, song: "The Sound of Silence", artist: "Simon & Garfunkel" },
  { year: 1963, song: "Blowin' in the Wind", artist: "Bob Dylan" },
  { year: 1971, song: "The Times They Are A-Changin'", artist: "Bob Dylan" },
  { year: 1936, song: "Cross Road Blues", artist: "Robert Johnson" },
  { year: 1968, song: "The Thrill Is Gone", artist: "B.B. King" },
  { year: 1967, song: "Sittin' on Top of the World", artist: "Howlin' Wolf" },
  { year: 1945, song: "Foggy Mountain Breakdown", artist: "Earl Scruggs" },
  { year: 1946, song: "Blue Moon of Kentucky", artist: "Bill Monroe" },
  { year: 1970, song: "Big Yellow Taxi", artist: "Joni Mitchell" },
  { year: 1971, song: "The River", artist: "Joni Mitchell" },

  // Reggae / dancehall.
  { year: 1973, song: "No Woman, No Cry", artist: "Bob Marley" },
  { year: 1973, song: "I Shot the Sheriff", artist: "Bob Marley" },
  { year: 1977, song: "One Love", artist: "Bob Marley" },
  { year: 1972, song: "Many Rivers to Cross", artist: "Jimmy Cliff" },
  { year: 1993, song: "Informer", artist: "Snow" },
  { year: 1995, song: "Boombastic", artist: "Shaggy" },
  { year: 2000, song: "It Wasn't Me", artist: "Shaggy" },

  // Bollywood — enormous dance-cover scene, especially among diaspora.
  { year: 1995, song: "Tujhe Dekha To", artist: "Lata Mangeshkar" },
  { year: 1998, song: "Chaiyya Chaiyya", artist: "Sukhwinder Singh" },
  { year: 2001, song: "Kal Ho Naa Ho", artist: "Sonu Nigam" },
  { year: 2010, song: "Sheila Ki Jawani", artist: "Sunidhi Chauhan" },
  { year: 2013, song: "Kun Faya Kun", artist: "A.R. Rahman" },
  { year: 2015, song: "Gerua", artist: "Arijit Singh" },
  { year: 2019, song: "Kalank Title Track", artist: "Arijit Singh" },

  // Afrobeats — fast-growing cover/dance scene.
  { year: 2016, song: "Fall", artist: "Davido" },
  { year: 2017, song: "Fever", artist: "Wizkid" },
  { year: 2018, song: "Soco", artist: "Wizkid" },
  { year: 2020, song: "Last Last", artist: "Burna Boy" },
  { year: 2021, song: "Essence", artist: "Wizkid" },
  { year: 2022, song: "Calm Down", artist: "Rema" },
  { year: 2023, song: "Unavailable", artist: "Davido" },

  // Patriotic / national standards — a recurring, non-chart cover category.
  { year: 1814, song: "The Star-Spangled Banner", artist: "Francis Scott Key" },
  { year: 1938, song: "God Bless America", artist: "Kate Smith" },
  { year: 1940, song: "This Land Is Your Land", artist: "Woody Guthrie" },
  { year: 1984, song: "Born in the U.S.A.", artist: "Bruce Springsteen" },
  { year: 1984, song: "God Bless the U.S.A.", artist: "Lee Greenwood" },

  // Big band / swing standards.
  { year: 1939, song: "In the Mood", artist: "Glenn Miller" },
  { year: 1941, song: "Chattanooga Choo Choo", artist: "Glenn Miller" },
  { year: 1936, song: "Sing, Sing, Sing", artist: "Benny Goodman" },
  { year: 1943, song: "Take the 'A' Train", artist: "Duke Ellington" },
  { year: 1956, song: "Mack the Knife", artist: "Bobby Darin" },

  // 90s grunge / alt rock.
  { year: 1991, song: "Smells Like Teen Spirit", artist: "Nirvana" },
  { year: 1992, song: "Alive", artist: "Pearl Jam" },
  { year: 1992, song: "Man in the Box", artist: "Alice in Chains" },
  { year: 1993, song: "Black Hole Sun", artist: "Soundgarden" },
  { year: 1993, song: "Creep", artist: "Radiohead" },
  { year: 1994, song: "Loser", artist: "Beck" },
  { year: 1995, song: "Wonderwall", artist: "Oasis" },
  { year: 1996, song: "Iris", artist: "Goo Goo Dolls" },
  { year: 1997, song: "Semi-Charmed Life", artist: "Third Eye Blind" },
  { year: 1998, song: "Torn", artist: "Natalie Imbruglia" },
];
