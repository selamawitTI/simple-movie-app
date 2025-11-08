const OMDb_API_KEY = "dd14d461"; 

const form = document.querySelector('form');
const searchInput = form.querySelector('input'); 
const container = document.querySelector('.image-continer');
const statusMessage = document.getElementById('status-message'); 
const showFavoritesBtn = document.getElementById('show-favorites-btn');
const modal = document.getElementById('movie-detail-modal');
const closeModal = modal.querySelector('.close-btn');
const modalDetails = document.getElementById('modal-details');

const PLACEHOLDER_IMG = 'https://via.placeholder.com/220x330?text=No+Poster+Available';
const FAVORITES_KEY = 'movieAppFavorites';



function getFavorites() {
    try {
        const favorites = localStorage.getItem(FAVORITES_KEY);
        return favorites ? JSON.parse(favorites) : [];
    } catch (e) {
        console.error("Error reading favorites from localStorage", e);
        return [];
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        updateFavoritesButtonCount(favorites.length);
    } catch (e) {
        console.error("Error saving favorites to localStorage", e);
    }
}

function toggleFavorite(imdbID) {
    const favorites = getFavorites();
    const index = favorites.indexOf(imdbID);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(imdbID);
    }
    
    saveFavorites(favorites);
    
   
    document.querySelectorAll(`[data-imdb-id="${imdbID}"] .bookmark-icon`).forEach(icon => {
        icon.classList.toggle('favorited', index === -1);
    });
}

function updateFavoritesButtonCount(count) {
    showFavoritesBtn.textContent = `Show My Watchlist (${count})`;
}


updateFavoritesButtonCount(getFavorites().length);



function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

async function fetchMovies(query) {
    
    container.innerHTML = ''; 
    statusMessage.textContent = 'Loading...'; 
    if (!query) {
        statusMessage.textContent = 'Please enter a movie name 🤔 ';
        return;
    }
    
    const url = `http://www.omdbapi.com/?s=${query}&apikey=${OMDb_API_KEY}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
             throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.Response === 'False') {
            statusMessage.textContent = `No results found for "${query}".`;
            return;
        }

        statusMessage.textContent = ''; 
        makeMovieItems(data.Search);

    } catch (error) {
        console.error('Fetch error:', error);
        statusMessage.textContent = `Error: Could not fetch data. Check network or API key.`;
    }
}


function makeMovieItems(movies) {
    const favorites = getFavorites();
    
    for (const movie of movies) {
        
        const isFavorited = favorites.includes(movie.imdbID);
        
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');
        movieItem.dataset.imdbId = movie.imdbID; 

        const bookmarkIcon = document.createElement('i');
        bookmarkIcon.classList.add('fa-solid', 'fa-bookmark', 'bookmark-icon');
        if (isFavorited) {
            bookmarkIcon.classList.add('favorited');
        }
        
        bookmarkIcon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleFavorite(movie.imdbID);
        });

        
        const img = document.createElement('img');
        img.src = movie.Poster === 'N/A' ? PLACEHOLDER_IMG : movie.Poster;
        img.alt = movie.Title;
        
        const movieInfo = document.createElement('div');
        movieInfo.classList.add('movie-info');
        
        const title = document.createElement('h3');
        title.textContent = movie.Title; 
        const year = document.createElement('p');
        year.textContent = `Year: ${movie.Year} (${movie.Type})`; 
        
        movieInfo.appendChild(title);
        movieInfo.appendChild(year);
        
        movieItem.appendChild(bookmarkIcon); 
        movieItem.appendChild(img);
        movieItem.appendChild(movieInfo);
        
        
        movieItem.addEventListener('click', () => {
            showMovieDetail(movie.imdbID);
        });
        
        container.appendChild(movieItem);
    }
}



async function showMovieDetail(imdbID) {
    modal.style.display = "block";
    modalDetails.innerHTML = '<p style="text-align: center;">Loading detailed information...</p>';
    
    const url = `http://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=${OMDb_API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch details');
        const data = await response.json();
        
        if (data.Response === 'False') {
            modalDetails.innerHTML = '<p>Details not found for this movie.</p>';
            return;
        }

        const isFavorited = getFavorites().includes(data.imdbID);
        
        
        modalDetails.innerHTML = `
            <img src="${data.Poster === 'N/A' ? PLACEHOLDER_IMG : data.Poster}" alt="${data.Title}">
            
            <div class="detail-text-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2>${data.Title} (${data.Year})</h2>
                    <i id="modal-bookmark-icon" class="fa-solid fa-bookmark bookmark-icon" data-imdb-id="${data.imdbID}" style="position: static; font-size: 2rem;"></i>
                </div>
                
                <p><strong>Plot:</strong> ${data.Plot}</p>
                <p><strong>Genre:</strong> ${data.Genre} | <strong>Runtime:</strong> ${data.Runtime}</p>
                <p><strong>IMDb Rating:</strong> **${data.imdbRating}** | <strong>Metascore:</strong> ${data.Metascore}</p>
                <p><strong>Director:</strong> ${data.Director}</p>
                <p><strong>Actors:</strong> ${data.Actors}</p>
                <p><strong>Awards:</strong> ${data.Awards}</p>
            </div>
        `;
        
        
        const modalIcon = document.getElementById('modal-bookmark-icon');
        if (isFavorited) {
            modalIcon.classList.add('favorited');
        }

        modalIcon.addEventListener('click', () => {
            toggleFavorite(data.imdbID);
          
            modalIcon.classList.toggle('favorited'); 
        });

    } catch (error) {
        console.error('Detail fetch error:', error);
        modalDetails.innerHTML = '<p>Could not load movie details.</p>';
    }
}


closeModal.addEventListener('click', () => {
    modal.style.display = "none";
});


window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});


form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim(); 
    fetchMovies(query);
});


const debouncedSearch = debounce((query) => {
    fetchMovies(query);
}, 500); 
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) { 
        debouncedSearch(query);
    } else if (query.length === 0) {
        container.innerHTML = '';
        statusMessage.textContent = '';
    }
});


showFavoritesBtn.addEventListener('click', async () => {
    const favorites = getFavorites();
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        statusMessage.textContent = 'Your Watchlist is empty. Time to find some great movies! 🎬';
        return;
    }

    statusMessage.textContent = `Loading ${favorites.length} movie(s) from your Watchlist...`;
    
    const detailedFavorites = [];
  
    for (const imdbID of favorites) {
      
        const url = `http://www.omdbapi.com/?i=${imdbID}&apikey=${OMDb_API_KEY}`; 
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                detailedFavorites.push(data);
            }
        } catch (error) {
            console.error(`Error fetching detail for ID ${imdbID}:`, error);
        }
    }
    
    if (detailedFavorites.length > 0) {
        statusMessage.textContent = '';
        makeMovieItems(detailedFavorites);
    } else {
        statusMessage.textContent = 'Could not load the movies in your Watchlist.';
    }
});