// Third genre-diverse pass, filling gaps lists 5 and 6 left untouched:
// EDM/dance, classical masterworks and opera arias, gospel/spirituals,
// Britpop/shoegaze/post-punk, Vocaloid/J-pop/city pop, Mandopop/Cantopop,
// more video game themes, bossa nova, ska, nu-metal/rap-rock, and the
// viral sea-shanty folk-revival trend. Same criterion as lists 5/6
// (cover/version volume, not chart-verified); "year" is release year, or
// first major recording/composition year for a standard with no single
// release. Overlap with other lists is fine, alreadySeeded() in seed.mts
// skips duplicates for free.
export interface SeedSong {
  year: number;
  song: string;
  artist: string;
}

export const SEED_SONGS_7: SeedSong[] = [
  // EDM / house / dubstep / trance — a huge remix/mashup cover scene.
  { year: 2013, song: "Wake Me Up", artist: "Avicii" },
  { year: 2011, song: "Levels", artist: "Avicii" },
  { year: 2012, song: "Scary Monsters and Nice Sprites", artist: "Skrillex" },
  { year: 2011, song: "Bangarang", artist: "Skrillex" },
  { year: 2008, song: "Ghosts 'n' Stuff", artist: "Deadmau5" },
  { year: 2010, song: "Strobe", artist: "Deadmau5" },
  { year: 2012, song: "Don't You Worry Child", artist: "Swedish House Mafia" },
  { year: 2011, song: "Feel So Close", artist: "Calvin Harris" },
  { year: 2014, song: "Summer", artist: "Calvin Harris" },
  { year: 2001, song: "One More Time", artist: "Daft Punk" },
  { year: 2007, song: "Harder, Better, Faster, Stronger", artist: "Daft Punk" },
  { year: 2013, song: "Get Lucky", artist: "Daft Punk" },
  { year: 2014, song: "Closer", artist: "The Chainsmokers" },
  { year: 2016, song: "Don't Let Me Down", artist: "The Chainsmokers" },
  { year: 2012, song: "Titanium", artist: "David Guetta" },
  { year: 2009, song: "When Love Takes Over", artist: "David Guetta" },
  { year: 2012, song: "Clarity", artist: "Zedd" },
  { year: 2015, song: "Lean On", artist: "Major Lazer" },

  // Classical masterworks — a constant piano/violin/orchestral cover
  // target, often with no one "official" recording.
  { year: 1808, song: "Symphony No. 5", artist: "Beethoven" },
  { year: 1801, song: "Moonlight Sonata", artist: "Beethoven" },
  { year: 1824, song: "Symphony No. 9 (Ode to Joy)", artist: "Beethoven" },
  { year: 1787, song: "Eine kleine Nachtmusik", artist: "Mozart" },
  { year: 1791, song: "Requiem", artist: "Mozart" },
  { year: 1723, song: "The Four Seasons", artist: "Vivaldi" },
  { year: 1680, song: "Canon in D", artist: "Pachelbel" },
  { year: 1876, song: "Bridal Chorus", artist: "Wagner" },
  { year: 1888, song: "Clair de Lune", artist: "Debussy" },
  { year: 1874, song: "Hungarian Dance No. 5", artist: "Brahms" },
  { year: 1812, song: "Für Elise", artist: "Beethoven" },
  { year: 1838, song: "Nocturne in E-flat Major", artist: "Chopin" },
  { year: 1812, song: "1812 Overture", artist: "Tchaikovsky" },
  { year: 1875, song: "Piano Concerto No. 1", artist: "Tchaikovsky" },
  { year: 1913, song: "The Rite of Spring", artist: "Stravinsky" },
  { year: 1936, song: "Carmina Burana", artist: "Carl Orff" },
  { year: 1900, song: "Nessun Dorma", artist: "Puccini" },
  { year: 1875, song: "Habanera", artist: "Bizet" },
  { year: 1759, song: "Ave Maria", artist: "Schubert" },
  { year: 1853, song: "La Donna è Mobile", artist: "Verdi" },

  // Gospel / spirituals — distinct from contemporary worship (list 5).
  { year: 1967, song: "Oh Happy Day", artist: "Edwin Hawkins Singers" },
  { year: 1905, song: "His Eye Is on the Sparrow", artist: "Civilla Martin" },
  { year: 1901, song: "Wade in the Water", artist: "Negro Spiritual" },
  { year: 1865, song: "Down by the Riverside", artist: "Negro Spiritual" },
  { year: 1909, song: "Swing Low, Sweet Chariot", artist: "Negro Spiritual" },
  { year: 1972, song: "Precious Lord, Take My Hand", artist: "Thomas A. Dorsey" },
  { year: 1990, song: "I'll Fly Away", artist: "Albert E. Brumley" },
  { year: 1997, song: "I Can Only Imagine", artist: "MercyMe" },

  // Britpop / shoegaze / post-punk.
  { year: 1994, song: "Girls & Boys", artist: "Blur" },
  { year: 1995, song: "Country House", artist: "Blur" },
  { year: 1995, song: "Common People", artist: "Pulp" },
  { year: 1996, song: "Trash", artist: "Suede" },
  { year: 1986, song: "There Is a Light That Never Goes Out", artist: "The Smiths" },
  { year: 1983, song: "This Charming Man", artist: "The Smiths" },
  { year: 1979, song: "Love Will Tear Us Apart", artist: "Joy Division" },
  { year: 1991, song: "Only Shallow", artist: "My Bloody Valentine" },
  { year: 2001, song: "Pure Shores", artist: "All Saints" },

  // Vocaloid / J-pop / city pop.
  { year: 2007, song: "World Is Mine", artist: "Hatsune Miku" },
  { year: 2011, song: "Senbonzakura", artist: "Hatsune Miku" },
  { year: 2010, song: "Rolling Girl", artist: "Hatsune Miku" },
  { year: 1984, song: "Plastic Love", artist: "Mariya Takeuchi" },
  { year: 1981, song: "Stay with Me", artist: "Miki Matsubara" },
  { year: 1980, song: "Tokyo Night Club", artist: "Yellow Magic Orchestra" },

  // Mandopop / Cantopop.
  { year: 2003, song: "Qing Hua Ci", artist: "Jay Chou" },
  { year: 2000, song: "Love Before the 7th Grade", artist: "Jay Chou" },
  { year: 1980, song: "The Moon Represents My Heart", artist: "Teresa Teng" },
  { year: 1994, song: "Red Bean", artist: "Faye Wong" },
  { year: 1993, song: "A Thousand Dreams of You", artist: "Faye Wong" },

  // More video game themes beyond lists 5/6's selection.
  { year: 1996, song: "Pokemon Theme", artist: "Jason Paige" },
  { year: 1991, song: "Sonic the Hedgehog Green Hill Zone", artist: "Masato Nakamura" },
  { year: 2001, song: "Halo Theme", artist: "Martin O'Donnell" },
  { year: 2011, song: "Wet Hands", artist: "C418" },
  { year: 2011, song: "Sweden", artist: "C418" },
  { year: 2015, song: "Hopes and Dreams", artist: "Toby Fox" },
  { year: 2002, song: "Dearly Beloved", artist: "Yoko Shimomura" },
  { year: 1990, song: "Tetris Theme (Korobeiniki)", artist: "Hirokazu Tanaka" },
  { year: 2007, song: "Still Alive", artist: "Jonathan Coulton" },

  // Bossa nova / Brazilian.
  { year: 1962, song: "Garota de Ipanema", artist: "Antonio Carlos Jobim" },
  { year: 1960, song: "Desafinado", artist: "Antonio Carlos Jobim" },
  { year: 1962, song: "Corcovado", artist: "Antonio Carlos Jobim" },
  { year: 1963, song: "Mas Que Nada", artist: "Jorge Ben" },

  // Ska.
  { year: 1996, song: "Sell Out", artist: "Reel Big Fish" },
  { year: 1997, song: "Just a Girl", artist: "No Doubt" },
  { year: 1996, song: "Santeria", artist: "Sublime" },
  { year: 1992, song: "What I Got", artist: "Sublime" },

  // Nu-metal / rap-rock.
  { year: 1999, song: "Freak on a Leash", artist: "Korn" },
  { year: 1994, song: "Blind", artist: "Korn" },
  { year: 2000, song: "Break Stuff", artist: "Limp Bizkit" },
  { year: 1999, song: "Nookie", artist: "Limp Bizkit" },
  { year: 1999, song: "Chop Suey!", artist: "System of a Down" },
  { year: 2001, song: "Toxicity", artist: "System of a Down" },
  { year: 2000, song: "Bring Me to Life", artist: "Evanescence" },
  { year: 2001, song: "Last Resort", artist: "Papa Roach" },

  // Viral sea-shanty / folk-revival trend.
  { year: 1830, song: "The Wellerman", artist: "Traditional" },
  { year: 1850, song: "Drunken Sailor", artist: "Traditional" },
  { year: 1700, song: "Scarborough Fair", artist: "Traditional" },
  { year: 1600, song: "Greensleeves", artist: "Traditional" },
];
