document.addEventListener('DOMContentLoaded', function () {
    const music = document.getElementById('background-music');
    const preloadImage = new Image();
    preloadImage.src = 'background.gif';

    music.load();

    const chromeStorageFallback = {
        sync: {
            get: function(keys, callback) {
                console.log('Using localStorage fallback for get');
                const result = {};
                if (typeof keys === 'string') {
                    result[keys] = localStorage.getItem(keys);
                } else if (Array.isArray(keys)) {
                    keys.forEach(key => {
                        result[key] = localStorage.getItem(key);
                        if (result[key] && (result[key].startsWith('{') || result[key].startsWith('['))) {
                            try {
                                result[key] = JSON.parse(result[key]);
                            } catch (e) {
								console.error('Failed to parse JSON:', e);
                            }
                        }
                    });
                } else if (typeof keys === 'object') {
                    Object.keys(keys).forEach(key => {
                        const stored = localStorage.getItem(key);
                        result[key] = stored !== null ? stored : keys[key];
                    });
                }
                callback(result);
            },
            set: function(items, callback) {
                console.log('Using localStorage fallback for set');
                Object.keys(items).forEach(key => {
                    if (typeof items[key] === 'object' && items[key] !== null) {
                        localStorage.setItem(key, JSON.stringify(items[key]));
                    } else {
                        localStorage.setItem(key, items[key]);
                    }
                });
                if (callback) callback();
                return Promise.resolve();
            }
        }
    };

    const storage = typeof chrome !== 'undefined' && chrome.storage 
        ? chrome.storage 
        : chromeStorageFallback;
        
    let wasMusicPlaying = false;
    
    function playMusic() {
        music.loop = true;

        storage.sync.get(['musicPosition'], function(result) {
            if (result.musicPosition) {
                try {
                    music.currentTime = parseFloat(result.musicPosition);
                    console.log('Restored music position to:', music.currentTime);
                } catch (e) {
                    console.error('Failed to restore music position:', e);
                }
            }
            
            if (document.visibilityState === 'visible') {
                music.play()
                    .then(() => {
                        console.log('Audio started playing');
                    })
                    .catch(error => {
                        console.log('Audio autoplay failed: ' + error);
                        document.addEventListener('click', () => {
                            music.play();
                            const notice = document.querySelector('.music-notice');
                            if (notice) notice.remove();
                        }, { once: true });

                        const notice = document.createElement('div');
                        notice.className = 'music-notice';
                        notice.innerHTML = 'Click anywhere to play background music';
                        notice.style.position = 'fixed';
                        notice.style.bottom = '20px';
                        notice.style.left = '50%';
                        notice.style.transform = 'translateX(-50%)';
                        notice.style.padding = '10px 15px';
                        notice.style.backgroundColor = 'rgba(0,0,0,0.7)';
                        notice.style.color = 'white';
                        notice.style.borderRadius = '5px';
                        notice.style.zIndex = '1000';
                        document.body.appendChild(notice);
                    });
            }
        });
    }

    setInterval(function() {
        if (!music.paused && music.currentTime > 0) {
            storage.sync.set({musicPosition: music.currentTime});
            console.log('Saved music position:', music.currentTime);
        }
    }, 5000);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            wasMusicPlaying = !music.paused;
            if (wasMusicPlaying) {
                storage.sync.set({musicPosition: music.currentTime});
                console.log('Tab hidden, saved position:', music.currentTime);
                music.pause();
            }
        } else if (document.visibilityState === 'visible' && wasMusicPlaying) {
            music.play()
                .then(() => console.log('Resumed music playback'))
                .catch(e => console.log('Could not resume playback:', e));
        }
    });

    window.addEventListener('beforeunload', function() {
        if (!music.paused && music.currentTime > 0) {
            storage.sync.set({musicPosition: music.currentTime});
            console.log('Saving position before unload:', music.currentTime);
        }
    });

    playMusic();

    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const altSearchLinks = document.getElementById('alt-search-links');
    
    const searchEngines = {
        Google: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        Bing: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        DuckDuckGo: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        Yahoo: (query) => `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`,
        Brave: (query) => `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
        GitHub: (query) => `https://github.com/search?q=${encodeURIComponent(query)}`,
        Reddit: (query) => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
        StackOverflow: (query) => `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
        Wikipedia: (query) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`,
        YouTube: (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
		MangaDex: (query) => `https://mangadex.org/search?title=${encodeURIComponent(query)}`,
        Amazon: (query) => `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
		EHentai: (query) => `https://e-hentai.org/?f_search=${encodeURIComponent(query)}`,
		E621: (query) => `https://e621.net/post?tags=${encodeURIComponent(query)}`,
		Nhentai: (query) => `https://nhentai.net/search/?q=${encodeURIComponent(query)}`,
		Pixiv: (query) => `https://www.pixiv.net/search.php?s_mode=s_tag&word=${encodeURIComponent(query)}`,
		OneThreeThreeSevenX: (query) => `https://1337x.to/search/${encodeURIComponent(query)}/1/`,
		Sankaku: (query) => `https://chan.sankakucomplex.com/?tags=${encodeURIComponent(query)}`,
		Danbooru: (query) => `https://danbooru.donmai.us/posts?tags=${encodeURIComponent(query)}`,
		Gelbooru: (query) => `https://gelbooru.com/index.php?page=post&s=list&tags=${encodeURIComponent(query)}`,
		Konachan: (query) => `https://konachan.com/post?tags=${encodeURIComponent(query)}`,
		Yande: (query) => `https://yande.re/post?tags=${encodeURIComponent(query)}`,
		Safebooru: (query) => `https://safebooru.org/index.php?page=post&s=list&tags=${encodeURIComponent(query)}`,
		Rule34: (query) => `https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(query)}`,
		Hypnohub: (query) => `https://hypnohub.net/post?tags=${encodeURIComponent(query)}`,
		Paheal: (query) => `https://rule34.paheal.net/post/list/${encodeURIComponent(query)}`,
		TBIB: (query) => `https://thebarchive.com/b/search/${encodeURIComponent(query)}`,
		FChan: (query) => `https://fchan.us/?q=${encodeURIComponent(query)}`,
		FurAffinity: (query) => `https://www.furaffinity.net/search/?q=${encodeURIComponent(query)}`,
		Inkbunny: (query) => `https://inkbunny.net/search.php?q=${encodeURIComponent(query)}`,
		SoFurry: (query) => `https://www.sofurry.com/browse/search?query=${encodeURIComponent(query)}`,
		Weasyl: (query) => `https://www.weasyl.com/search?query=${encodeURIComponent(query)}`,
		DeviantArt: (query) => `https://www.deviantart.com/search?q=${encodeURIComponent(query)}`,
		ArtStation: (query) => `https://www.artstation.com/search?q=${encodeURIComponent(query)}`,
		Newgrounds: (query) => `https://www.newgrounds.com/search?q=${encodeURIComponent(query)}`,
		itchio: (query) => `https://itch.io/search?q=${encodeURIComponent(query)}`,
		GameJolt: (query) => `https://gamejolt.com/search?q=${encodeURIComponent(query)}`,
		IndieDB: (query) => `https://www.indiedb.com/search?q=${encodeURIComponent(query)}`,
		ModDB: (query) => `https://www.moddb.com/search?q=${encodeURIComponent(query)}`,
		Steam: (query) => `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
		GOG: (query) => `https://www.gog.com/games?search=${encodeURIComponent(query)}`,
		HumbleBundle: (query) => `https://www.humblebundle.com/store/search?search=${encodeURIComponent(query)}`,
		Origin: (query) => `https://www.origin.com/search?searchString=${encodeURIComponent(query)}`,
		Uplay: (query) => `https://store.ubi.com/us/search?q=${encodeURIComponent(query)}`,
		Netflix: (query) => `https://www.netflix.com/search?q=${encodeURIComponent(query)}`,
		Hulu: (query) => `https://www.hulu.com/search?q=${encodeURIComponent(query)}`,
		
    };
    
    let selectedEngine = 'Google';
    let lastQuery = '';
    
    storage.sync.get(['selectedEngine', 'lastQuery'], function(result) {
        if (result.selectedEngine) {
            selectedEngine = result.selectedEngine;
        }
        if (result.lastQuery) {
            lastQuery = result.lastQuery;
            searchInput.value = lastQuery;
            updateSearchEngines(lastQuery);
        }
    });
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        lastQuery = query;
        
        // Save last query to storage
        storage.sync.set({lastQuery: query});
        
        if (query) {
            updateSearchEngines(query);
        } else {
            altSearchLinks.innerHTML = '';
        }
    });
    
    function updateSearchEngines(query) {
        altSearchLinks.innerHTML = '';
        
        Object.keys(searchEngines).forEach((name, index) => {
            const link = document.createElement('a');
            link.href = searchEngines[name](query);
            link.textContent = name;
            link.dataset.engine = name;
            link.className = 'search-link';
            
            if (name === selectedEngine) {
                link.classList.add('selected');
                link.setAttribute('tabindex', '1');
            } else {
                link.setAttribute('tabindex', '2');
            }
            
            link.addEventListener('click', function(e) {
                e.preventDefault();
                selectedEngine = name;
                
                storage.sync.set({selectedEngine: name});
                
                document.querySelectorAll('.search-link').forEach(l => {
                    l.classList.remove('selected');
                    l.setAttribute('tabindex', '2');
                });
                
                this.classList.add('selected');
                this.setAttribute('tabindex', '1');
                
                if (query) {
                    window.location.href = searchEngines[name](query);
                }
            });
            
            link.addEventListener('focus', function() {
                selectedEngine = name;
                
                document.querySelectorAll('.search-link').forEach(l => {
                    l.classList.remove('selected');
                });
                
                this.classList.add('selected');
            });
            
            altSearchLinks.appendChild(link);
        });
    }

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        
        if (query) {
            window.location.href = searchEngines[selectedEngine](query);
        }
    });

    document.addEventListener('keydown', function(e) {
        const query = searchInput.value.trim();
        
        if (!query) return;
        
        if (e.key === 'Tab') {
            e.preventDefault();
            
            const engines = Object.keys(searchEngines);
            const currentIndex = engines.indexOf(selectedEngine);
            const nextIndex = (currentIndex + 1) % engines.length;
            selectedEngine = engines[nextIndex];
            const links = document.querySelectorAll('.search-link');
            links.forEach(link => {
                link.classList.remove('selected');
                link.setAttribute('tabindex', '2');
            });
            
            links[nextIndex].classList.add('selected');
            links[nextIndex].setAttribute('tabindex', '1');
            links[nextIndex].focus();
        }
    });
    
    searchInput.focus();
});