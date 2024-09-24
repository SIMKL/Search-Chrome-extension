// defaults.js

/**
 * Generates a unique UUID.
 * Utilizes crypto.randomUUID() if available, otherwise falls back to a manual method.
 * @returns {string} A unique UUID.
 */
function generateId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    // Fallback for browsers that do not support crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
      const v = c === 'x' ? r.toString(16) : ((r & 0x3) | 0x8).toString(16);
      return v;
    });
  }
}

/**
 * Retrieves the default menu items.
 * @returns {Array<Object>} An array of menu item objects.
 */
function getDefaultMenuItems() {
  return [
	{
	  id: generateId(),
	  name: 'Simkl in TV Shows',
	  url: 'https://simkl.com/search?q=%s&type=tv',
	  queryEncoding: 'encodeURIComponent',
	  type: 'search'
	},
	{
	  id: generateId(),
	  name: 'Simkl in Anime',
	  url: 'https://simkl.com/search?q=%s&type=anime',
	  queryEncoding: 'encodeURIComponent',
	  type: 'search'
	},
	{
	  id: generateId(),
	  name: 'Simkl in Movies',
	  url: 'https://simkl.com/search?q=%s&type=movies',
	  queryEncoding: 'encodeURIComponent',
	  type: 'search'
	},
    {
      id: generateId(),
      name: '--- Separator ---',
      type: 'separator'
    },
    {
      id: generateId(),
      name: 'YouTube',
      url: 'https://www.youtube.com/results?search_query=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: 'Google Search',
      url: 'https://www.google.com/search?q=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: 'Google for "watch online"',
      url: 'https://www.google.com/search?q=%s+watch+online',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: '--- Separator ---',
      type: 'separator'
    },
    {
	  id: generateId(),
	  name: 'Databases',
	  type: 'group',
	  items: [
		{
		  id: generateId(),
		  name: 'Simkl',
		  url: 'https://simkl.com/search?q=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},{
		  id: generateId(),
		  name: 'IMDB',
		  url: 'https://www.imdb.com/find?q=%s&s=all',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'TVDB',
		  url: 'https://www.thetvdb.com/search?query=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'TMDB',
		  url: 'https://www.themoviedb.org/search?query=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'MAL',
		  url: 'https://myanimelist.net/search/all?q=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'AniList',
		  url: 'https://anilist.co/search/anime?search=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Kitsu',
		  url: 'https://kitsu.app/anime?text=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Rotten Tomatoes',
		  url: 'https://www.rottentomatoes.com/search?search=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Letterboxd',
		  url: 'https://letterboxd.com/search/%s/',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'AnimePlanet',
		  url: 'https://www.anime-planet.com/search.php?search=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'FilmAffinity',
		  url: 'https://www.filmaffinity.com/en/search.php?stext=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Trakt',
		  url: 'https://trakt.tv/search?query=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'TVMaze',
		  url: 'https://www.tvmaze.com/search?q=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Douban',
		  url: 'https://www.douban.com/search?q=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Criticker',
		  url: 'https://www.criticker.com/?search=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Cineuropa',
		  url: 'https://cineuropa.org/en/searchpage/?search=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'JustWatch',
		  url: 'https://www.justwatch.com/us/search?q=%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: '--- Separator ---',
		  type: 'separator'
		},
		{
		  id: generateId(),
		  name: 'Search everywhere',
		  url: '',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		}
	  ]
	}
,
    {
      id: generateId(),
      name: 'ChatGPT',
      type: 'group',
      items: [
        {
		  id: generateId(),
		  name: 'Summarize',
		  url: 'https://chatgpt.com/?q=Summarize:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Translate to English',
		  url: 'https://chatgpt.com/?q=Translate%20to%20English:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Paraphrase',
		  url: 'https://chatgpt.com/?q=Paraphrase:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Explain',
		  url: 'https://chatgpt.com/?q=Explain:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Define',
		  url: 'https://chatgpt.com/?q=Define:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Grammar Check',
		  url: 'https://chatgpt.com/?q=Check%20grammar%20for:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Expand',
		  url: 'https://chatgpt.com/?q=Expand%20on:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Condense',
		  url: 'https://chatgpt.com/?q=Condense:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		},
		{
		  id: generateId(),
		  name: 'Bullet Points',
		  url: 'https://chatgpt.com/?q=Convert%20to%20bullet%20points:%20%s',
		  queryEncoding: 'encodeURIComponent',
		  type: 'search'
		}
      ]
    },
    {
      id: generateId(),
      name: 'Reddit',
      url: 'https://www.reddit.com/search/?q=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: 'X (Twitter)',
      url: 'https://x.com/search?q=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: 'Quora',
      url: 'https://www.quora.com/search?q=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: 'Medium',
      url: 'https://medium.com/search?q=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    },
    {
      id: generateId(),
      name: 'Wikipedia',
      url: 'https://en.wikipedia.org/w/index.php?title=Special:Search&search=%s',
      queryEncoding: 'encodeURIComponent',
      type: 'search'
    }
  ];
}
