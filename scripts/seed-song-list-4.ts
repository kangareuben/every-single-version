// Songs from the last ~20 years that are magnets for cover versions on
// YouTube specifically — acoustic/wedding staples, talent-show vocal
// showcases, busking/open-mic favorites, a cappella and metal-cover
// channel regulars. Different selection criterion than the other three
// lists (chart performance): this is about which songs draw the most
// cover-video volume, which is exactly the content this app surfaces.
// Not chart-verified, just high-confidence real songs. Overlap with the
// other lists is fine, alreadySeeded() skips it for free.
export interface SeedSong {
  year: number;
  song: string;
  artist: string;
}

export const SEED_SONGS_4: SeedSong[] = [
  { year: 2005, song: "Chasing Cars", artist: "Snow Patrol" },
  { year: 2005, song: "Banana Pancakes", artist: "Jack Johnson" },
  { year: 2006, song: "Hey There Delilah", artist: "Plain White T's" },
  { year: 2008, song: "I'm Yours", artist: "Jason Mraz" },
  { year: 2008, song: "Viva la Vida", artist: "Coldplay" },
  { year: 2008, song: "The Scientist", artist: "Coldplay" },
  { year: 2008, song: "Fix You", artist: "Coldplay" },
  { year: 2008, song: "Halo", artist: "Beyonce" },
  { year: 2008, song: "Chasing Pavements", artist: "Adele" },
  { year: 2009, song: "Use Somebody", artist: "Kings of Leon" },
  { year: 2009, song: "Fireflies", artist: "Owl City" },
  { year: 2010, song: "Skinny Love", artist: "Bon Iver" },
  { year: 2010, song: "Yellow", artist: "Coldplay" },
  { year: 2011, song: "Rolling in the Deep", artist: "Adele" },
  { year: 2011, song: "Someone Like You", artist: "Adele" },
  { year: 2011, song: "Set Fire to the Rain", artist: "Adele" },
  { year: 2011, song: "Little Talks", artist: "Of Monsters and Men" },
  { year: 2012, song: "Ho Hey", artist: "The Lumineers" },
  { year: 2012, song: "Somebody That I Used to Know", artist: "Gotye" },
  { year: 2013, song: "Riptide", artist: "Vance Joy" },
  { year: 2013, song: "Say Something", artist: "A Great Big World" },
  { year: 2013, song: "Demons", artist: "Imagine Dragons" },
  { year: 2013, song: "Radioactive", artist: "Imagine Dragons" },
  { year: 2013, song: "Wrecking Ball", artist: "Miley Cyrus" },
  { year: 2013, song: "Let Her Go", artist: "Passenger" },
  { year: 2014, song: "Stay With Me", artist: "Sam Smith" },
  { year: 2014, song: "All of Me", artist: "John Legend" },
  { year: 2014, song: "Take Me to Church", artist: "Hozier" },
  { year: 2014, song: "Chandelier", artist: "Sia" },
  { year: 2014, song: "Photograph", artist: "Ed Sheeran" },
  { year: 2014, song: "A Sky Full of Stars", artist: "Coldplay" },
  { year: 2015, song: "Thinking Out Loud", artist: "Ed Sheeran" },
  { year: 2015, song: "All I Want", artist: "Kodaline" },
  { year: 2015, song: "Hello", artist: "Adele" },
  { year: 2015, song: "Stitches", artist: "Shawn Mendes" },
  { year: 2015, song: "Jealous", artist: "Labrinth" },
  { year: 2016, song: "Stressed Out", artist: "Twenty One Pilots" },
  { year: 2016, song: "7 Years", artist: "Lukas Graham" },
  { year: 2016, song: "Treat You Better", artist: "Shawn Mendes" },
  { year: 2016, song: "Never Be the Same", artist: "Camila Cabello" },
  { year: 2017, song: "Perfect", artist: "Ed Sheeran" },
  { year: 2017, song: "Say You Won't Let Go", artist: "James Arthur" },
  { year: 2017, song: "Shape of You", artist: "Ed Sheeran" },
  { year: 2017, song: "Issues", artist: "Julia Michaels" },
  { year: 2018, song: "In My Blood", artist: "Shawn Mendes" },
  { year: 2018, song: "This Town", artist: "Niall Horan" },
  { year: 2018, song: "A Million Dreams", artist: "Ziv Zaifman" },
  { year: 2018, song: "Rewrite the Stars", artist: "Zac Efron" },
  { year: 2019, song: "Someone You Loved", artist: "Lewis Capaldi" },
  { year: 2019, song: "Lovely", artist: "Billie Eilish" },
  { year: 2019, song: "Bad Guy", artist: "Billie Eilish" },
  { year: 2019, song: "Señorita", artist: "Shawn Mendes" },
  { year: 2019, song: "If I Can't Have You", artist: "Shawn Mendes" },
  { year: 2019, song: "Shallow", artist: "Lady Gaga" },
  { year: 2019, song: "Sunflower", artist: "Post Malone" },
  { year: 2020, song: "Falling", artist: "Trevor Daniel" },
  { year: 2020, song: "Before You Go", artist: "Lewis Capaldi" },
  { year: 2020, song: "Watermelon Sugar", artist: "Harry Styles" },
  { year: 2020, song: "Adore You", artist: "Harry Styles" },
  { year: 2020, song: "Levitating", artist: "Dua Lipa" },
  { year: 2021, song: "Drivers License", artist: "Olivia Rodrigo" },
  { year: 2021, song: "Good 4 U", artist: "Olivia Rodrigo" },
  { year: 2021, song: "Happier Than Ever", artist: "Billie Eilish" },
  { year: 2021, song: "Willow", artist: "Taylor Swift" },
  { year: 2021, song: "Easy on Me", artist: "Adele" },
  { year: 2021, song: "Stay", artist: "The Kid Laroi" },
  { year: 2022, song: "As It Was", artist: "Harry Styles" },
  { year: 2022, song: "About Damn Time", artist: "Lizzo" },
  { year: 2022, song: "Late Night Talking", artist: "Harry Styles" },
  { year: 2022, song: "Anti-Hero", artist: "Taylor Swift" },
  { year: 2022, song: "Glimpse of Us", artist: "Joji" },
  { year: 2023, song: "Flowers", artist: "Miley Cyrus" },
  { year: 2023, song: "Vampire", artist: "Olivia Rodrigo" },
  { year: 2023, song: "Snooze", artist: "SZA" },
  { year: 2023, song: "Cruel Summer", artist: "Taylor Swift" },
  { year: 2024, song: "Beautiful Things", artist: "Benson Boone" },
  { year: 2024, song: "Lose Control", artist: "Teddy Swims" },
  { year: 2024, song: "Birds of a Feather", artist: "Billie Eilish" },
  { year: 2024, song: "Espresso", artist: "Sabrina Carpenter" },
  { year: 2025, song: "Ordinary", artist: "Alex Warren" },
  { year: 2025, song: "Die with a Smile", artist: "Lady Gaga and Bruno Mars" },

  // Timeless cover-video magnets that predate the 20-year window but
  // still draw enormous, steady cover volume on YouTube today — kept
  // since the point of this list is what actually gets covered, not
  // strict release-year purism.
  { year: 1994, song: "Hallelujah", artist: "Jeff Buckley" },
  { year: 1971, song: "Ain't No Sunshine", artist: "Bill Withers" },
];
