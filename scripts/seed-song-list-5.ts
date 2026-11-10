// Broader genre pass, not chart-verified like the Billboard-based lists —
// just well-known, unambiguous songs from scenes that draw heavy cover/
// version volume on YouTube but rarely top the Hot 100: musical theater,
// worship/CCM, anime, video games, K-pop, Latin, classic rock deep cuts,
// metal, jazz standards, Christmas standards, and soul/motown deep cuts.
// Overlap with the other four lists is fine, alreadySeeded() in seed.mts
// skips duplicates for free. "year" is release year where it's genuinely
// one thing (a single); for a show tune or standard with no single
// "release," it's the year of the show/film/first major recording.
export interface SeedSong {
  year: number;
  song: string;
  artist: string;
}

export const SEED_SONGS_5: SeedSong[] = [
  // Musical theater / Disney — reliably one of the heaviest cover
  // categories on YouTube (solo covers, a cappella, orchestral, kids).
  { year: 2013, song: "Let It Go", artist: "Idina Menzel" },
  { year: 2003, song: "Defying Gravity", artist: "Idina Menzel" },
  { year: 2015, song: "Alexander Hamilton", artist: "Lin-Manuel Miranda" },
  { year: 2015, song: "My Shot", artist: "Lin-Manuel Miranda" },
  { year: 2015, song: "Wait for It", artist: "Leslie Odom Jr." },
  { year: 1996, song: "Seasons of Love", artist: "Rent" },
  { year: 1987, song: "The Phantom of the Opera", artist: "Sarah Brightman" },
  { year: 1986, song: "Music of the Night", artist: "Michael Crawford" },
  { year: 1996, song: "Memory", artist: "Elaine Paige" },
  { year: 1971, song: "Tomorrow", artist: "Annie" },
  { year: 1964, song: "Climb Ev'ry Mountain", artist: "The Sound of Music" },
  { year: 1964, song: "My Favorite Things", artist: "The Sound of Music" },
  { year: 2014, song: "Do You Want to Build a Snowman?", artist: "Kristen Bell" },
  { year: 2019, song: "Into the Unknown", artist: "Idina Menzel" },
  { year: 2017, song: "This Is Me", artist: "Keala Settle" },
  { year: 1975, song: "One Day More", artist: "Les Miserables" },
  { year: 1980, song: "I Dreamed a Dream", artist: "Les Miserables" },
  { year: 1971, song: "Tomorrow Belongs to Me", artist: "Cabaret" },
  { year: 2006, song: "For Good", artist: "Wicked" },
  { year: 2006, song: "Popular", artist: "Wicked" },

  // Worship / CCM — massive cover and live-performance ecosystem.
  { year: 2013, song: "Oceans (Where Feet May Fail)", artist: "Hillsong UNITED" },
  { year: 2011, song: "10,000 Reasons (Bless the Lord)", artist: "Matt Redman" },
  { year: 2004, song: "How Great Is Our God", artist: "Chris Tomlin" },
  { year: 2006, song: "Amazing Grace (My Chains Are Gone)", artist: "Chris Tomlin" },
  { year: 2000, song: "Blessed Be Your Name", artist: "Matt Redman" },
  { year: 1997, song: "Shout to the Lord", artist: "Darlene Zschech" },
  { year: 2016, song: "What a Beautiful Name", artist: "Hillsong Worship" },
  { year: 2015, song: "Reckless Love", artist: "Cory Asbury" },
  { year: 2011, song: "Our God", artist: "Chris Tomlin" },
  { year: 2019, song: "Way Maker", artist: "Sinach" },
  { year: 1779, song: "Amazing Grace", artist: "John Newton" },

  // Anime openings/endings — one of YouTube's biggest cover scenes
  // (full band covers, vocal covers, instrumental).
  { year: 2019, song: "Gurenge", artist: "LiSA" },
  { year: 2013, song: "Guren no Yumiya", artist: "Linked Horizon" },
  { year: 1999, song: "Cruel Angel's Thesis", artist: "Yoko Takahashi" },
  { year: 2020, song: "Kaikai Kitan", artist: "Eve" },
  { year: 2019, song: "Zankoku na Tenshi no Thesis", artist: "Yoko Takahashi" },
  { year: 2016, song: "Unravel", artist: "TK from Ling Tosite Sigure" },
  { year: 2019, song: "Sorairo Days", artist: "Shoko Nakagawa" },
  { year: 2009, song: "Again", artist: "YUI" },
  { year: 2019, song: "Yoru ni Kakeru", artist: "YOASOBI" },
  { year: 2020, song: "Haruka", artist: "YOASOBI" },
  { year: 2020, song: "Dynamite", artist: "BTS" },

  // Video game themes — huge orchestral/metal/piano cover scene.
  { year: 1986, song: "The Legend of Zelda Main Theme", artist: "Koji Kondo" },
  { year: 1985, song: "Super Mario Bros. Theme", artist: "Koji Kondo" },
  { year: 1990, song: "One-Winged Angel", artist: "Nobuo Uematsu" },
  { year: 1997, song: "Aerith's Theme", artist: "Nobuo Uematsu" },
  { year: 2011, song: "Dragonborn", artist: "Jeremy Soule" },
  { year: 2007, song: "Still Alive", artist: "Jonathan Coulton" },
  { year: 2013, song: "Zelda's Lullaby", artist: "Koji Kondo" },
  { year: 2016, song: "Megalovania", artist: "Toby Fox" },
  { year: 1998, song: "Gerudo Valley", artist: "Koji Kondo" },

  // K-pop — enormous dance-cover and vocal-cover scene.
  { year: 2017, song: "DNA", artist: "BTS" },
  { year: 2020, song: "How You Like That", artist: "BLACKPINK" },
  { year: 2016, song: "Cheer Up", artist: "TWICE" },
  { year: 2009, song: "Gee", artist: "Girls' Generation" },
  { year: 2012, song: "I Am the Best", artist: "2NE1" },
  { year: 2022, song: "Hype Boy", artist: "NewJeans" },
  { year: 2021, song: "Butter", artist: "BTS" },
  { year: 2019, song: "Kill This Love", artist: "BLACKPINK" },

  // Latin / reggaeton — huge cross-genre cover and remix scene.
  { year: 2017, song: "Despacito", artist: "Luis Fonsi" },
  { year: 2018, song: "Taki Taki", artist: "DJ Snake" },
  { year: 2004, song: "La Tortura", artist: "Shakira" },
  { year: 2001, song: "Suerte", artist: "Shakira" },
  { year: 2017, song: "Mi Gente", artist: "J Balvin" },
  { year: 2019, song: "Con Calma", artist: "Daddy Yankee" },
  { year: 2004, song: "Gasolina", artist: "Daddy Yankee" },
  { year: 2009, song: "Danza Kuduro", artist: "Don Omar" },

  // Classic rock deep cuts — beyond each band's one chart-topper.
  { year: 1975, song: "Shine On You Crazy Diamond", artist: "Pink Floyd" },
  { year: 1979, song: "Comfortably Numb", artist: "Pink Floyd" },
  { year: 1973, song: "Money", artist: "Pink Floyd" },
  { year: 1971, song: "Stairway to Heaven", artist: "Led Zeppelin" },
  { year: 1969, song: "Whole Lotta Love", artist: "Led Zeppelin" },
  { year: 1975, song: "Kashmir", artist: "Led Zeppelin" },
  { year: 1975, song: "Bohemian Rhapsody", artist: "Queen" },
  { year: 1980, song: "Another One Bites the Dust", artist: "Queen" },
  { year: 1977, song: "We Will Rock You", artist: "Queen" },
  { year: 1973, song: "Free Bird", artist: "Lynyrd Skynyrd" },
  { year: 1976, song: "Hotel California", artist: "Eagles" },
  { year: 1971, song: "Riders on the Storm", artist: "The Doors" },
  { year: 1967, song: "Light My Fire", artist: "The Doors" },
  { year: 1969, song: "Fortunate Son", artist: "Creedence Clearwater Revival" },
  { year: 1971, song: "Layla", artist: "Derek and the Dominos" },
  { year: 1968, song: "While My Guitar Gently Weeps", artist: "The Beatles" },
  { year: 1969, song: "Here Comes the Sun", artist: "The Beatles" },
  { year: 1965, song: "Yesterday", artist: "The Beatles" },

  // Metal / power metal — a whole cover-channel ecosystem of its own.
  { year: 1986, song: "Master of Puppets", artist: "Metallica" },
  { year: 1991, song: "Enter Sandman", artist: "Metallica" },
  { year: 1986, song: "The Trooper", artist: "Iron Maiden" },
  { year: 1982, song: "Run to the Hills", artist: "Iron Maiden" },
  { year: 1981, song: "The Number of the Beast", artist: "Iron Maiden" },
  { year: 1980, song: "Crazy Train", artist: "Ozzy Osbourne" },
  { year: 1969, song: "Paranoid", artist: "Black Sabbath" },
  { year: 2000, song: "Blackened Is the Color", artist: "Nightwish" },
  { year: 2004, song: "Nemo", artist: "Nightwish" },
  { year: 2007, song: "Amaranth", artist: "Nightwish" },
  { year: 1999, song: "Through the Fire and Flames", artist: "DragonForce" },
  { year: 1997, song: "Fear of the Dark", artist: "Iron Maiden" },

  // Jazz / Great American Songbook standards — endless vocal-cover
  // volume, no single canonical chart era.
  { year: 1964, song: "Fly Me to the Moon", artist: "Frank Sinatra" },
  { year: 1966, song: "Summer Wind", artist: "Frank Sinatra" },
  { year: 1969, song: "My Way", artist: "Frank Sinatra" },
  { year: 1959, song: "Fever", artist: "Peggy Lee" },
  { year: 1959, song: "Feeling Good", artist: "Nina Simone" },
  { year: 1965, song: "Summertime", artist: "Ella Fitzgerald" },
  { year: 1930, song: "What a Wonderful World", artist: "Louis Armstrong" },
  { year: 1934, song: "All of Me", artist: "Billie Holiday" },

  // Christmas standards — seasonal, but a huge, recurring cover volume
  // every year across every genre.
  { year: 1994, song: "All I Want for Christmas Is You", artist: "Mariah Carey" },
  { year: 1958, song: "Jingle Bell Rock", artist: "Bobby Helms" },
  { year: 1957, song: "Rockin' Around the Christmas Tree", artist: "Brenda Lee" },
  { year: 1963, song: "Christmas (Baby Please Come Home)", artist: "Darlene Love" },
  { year: 1934, song: "Winter Wonderland", artist: "Felix Bernard" },
  { year: 1944, song: "Have Yourself a Merry Little Christmas", artist: "Judy Garland" },
  { year: 1984, song: "Last Christmas", artist: "Wham!" },
  { year: 1942, song: "White Christmas", artist: "Bing Crosby" },

  // Soul / Motown deep cuts.
  { year: 1967, song: "Respect", artist: "Aretha Franklin" },
  { year: 1968, song: "(Sittin' On) The Dock of the Bay", artist: "Otis Redding" },
  { year: 1970, song: "Ain't No Mountain High Enough", artist: "Diana Ross" },
  { year: 1968, song: "I Heard It Through the Grapevine", artist: "Marvin Gaye" },
  { year: 1972, song: "Superstition", artist: "Stevie Wonder" },
  { year: 1971, song: "What's Going On", artist: "Marvin Gaye" },
  { year: 1965, song: "My Girl", artist: "The Temptations" },
  { year: 1966, song: "Reach Out I'll Be There", artist: "Four Tops" },

  // Indie / modern singer-songwriter — acoustic-cover magnets.
  { year: 2008, song: "The Night We Met", artist: "Lord Huron" },
  { year: 2015, song: "Youth", artist: "Daughter" },
  { year: 2011, song: "Holocene", artist: "Bon Iver" },
  { year: 2007, song: "Fake Empire", artist: "The National" },
  { year: 2016, song: "Space Song", artist: "Beach House" },
  { year: 2019, song: "Liability", artist: "Lorde" },
  { year: 2013, song: "Royals", artist: "Lorde" },
  { year: 2015, song: "Mystery of Love", artist: "Sufjan Stevens" },
];
