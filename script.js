
const OMDb_API_KEY = "dd14d461"; 

const form = document.querySelector('form');
const searchInput = form.querySelector('input'); 
const container = document.querySelector('.image-continer');
const statusMessage = document.getElementById('status-message'); 
const PLACEHOLDER_IMG = 'https://via.placeholder.com/220x330?text=No+Poster+Available';


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
        statusMessage.textContent = 'Please enter the movie name 🤔 ';
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
    
    for (const movie of movies) {
        
       /* if (movie.Poster === 'N/A') continue;*/

        
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');

        
        const img = document.createElement('img');
        img.src = movie.Poster === 'N/A' ? PLACEHOLDER_IMG : movie.Poster;
        /*img.src = movie.Poster;*/ 
        img.alt = movie.Title;
        
        
        const movieInfo = document.createElement('div');
        movieInfo.classList.add('movie-info');
        
        
        const title = document.createElement('h3');
        title.textContent = movie.Title; 
        const year = document.createElement('p');
        year.textContent = `Year: ${movie.Year}`; 
        
        movieInfo.appendChild(title);
        movieInfo.appendChild(year);
        movieItem.appendChild(img);
        movieItem.appendChild(movieInfo);
        
        
        container.appendChild(movieItem);
    }
}


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


