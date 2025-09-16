// Live search functionality for notezy
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchForm = document.getElementById('searchForm');
    let searchTimeout;
    let currentSearchTerm = '';

    if (!searchInput || !searchResults) {
        return; // Exit if elements don't exist
    }

    // Add event delegation for search result clicks
    searchResults.addEventListener('click', function(e) {
        const searchResultItem = e.target.closest('.search-result-item[data-note-id]');
        const viewAllResults = e.target.closest('.view-all-results');
        
        if (searchResultItem) {
            const noteId = searchResultItem.dataset.noteId;
            window.location.href = `/dashboard/item/${noteId}`;
        } else if (viewAllResults) {
            e.preventDefault();
            const searchTerm = viewAllResults.dataset.searchTerm;
            submitSearchForm(searchTerm);
        }
    });

    // Function to perform live search
    function performLiveSearch(searchTerm) {
        if (searchTerm.length === 0) {
            hideSearchResults();
            return;
        }

        if (searchTerm.length < 1) {
            return;
        }

        // Show loading state
        showSearchResults();
        searchResults.innerHTML = '<div class="p-3 text-center text-muted">Searching...</div>';

        // Make API request
        fetch(`/api/v1/notes/search/${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displaySearchResults(data.notes, searchTerm);
                } else {
                    searchResults.innerHTML = '<div class="p-3 text-center text-danger">Search failed. Please try again.</div>';
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                searchResults.innerHTML = '<div class="p-3 text-center text-danger">Search failed. Please try again.</div>';
            });
    }

    // Function to display search results
    function displaySearchResults(notes, searchTerm) {
        if (notes.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-item p-3 text-center">
                    <div class="mb-2 text-muted">No notes found for "${searchTerm}"</div>
                    <small class="text-muted">Try different keywords or <a href="/dashboard/search" class="text-primary">advanced search</a></small>
                </div>
            `;
            return;
        }

        let html = '';
        notes.forEach(note => {
            // Truncate title and body for display
            const truncatedTitle = note.title.length > 40 ? note.title.substring(0, 40) + '...' : note.title;
            const truncatedBody = note.body.length > 80 ? note.body.substring(0, 80) + '...' : note.body;
            
            // Highlight search term in title and body
            const highlightedTitle = highlightSearchTerm(truncatedTitle, searchTerm);
            const highlightedBody = highlightSearchTerm(truncatedBody, searchTerm);

            html += `
                <div class="search-result-item p-3" data-note-id="${note._id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="search-result-title">${highlightedTitle}</h6>
                            <p class="search-result-body">${highlightedBody}</p>
                            <small class="search-result-date">
                                ${formatDate(note.updatedAt)}
                            </small>
                        </div>
                        <svg width="16" height="16" fill="currentColor" class="text-muted ms-2" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </div>
                </div>
            `;
        });

        // Add "View all results" link if there are many results
        if (notes.length >= 10) {
            html += `
                <div class="search-result-item p-3 text-center border-top">
                    <a href="/dashboard/search" class="text-primary text-decoration-none fw-semibold view-all-results" data-search-term="${searchTerm}">
                        View all results →
                    </a>
                </div>
            `;
        }

        searchResults.innerHTML = html;
    }

    // Function to highlight search term in text
    function highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || searchTerm.length === 0) return text;

        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        // Use a dedicated class so we can fully control styling via CSS
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    // Function to escape special regex characters
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Function to show search results
    function showSearchResults() {
        searchResults.style.display = 'block';
    }

    // Function to hide search results
    function hideSearchResults() {
        searchResults.style.display = 'none';
    }

    // Function to submit search form for full results
    function submitSearchForm(searchTerm) {
        searchInput.value = searchTerm;
        searchForm.submit();
    }

    // Event listener for input changes
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        currentSearchTerm = searchTerm;

        // Clear previous timeout
        clearTimeout(searchTimeout);

        // Set new timeout for debouncing
        searchTimeout = setTimeout(() => {
            if (currentSearchTerm === searchTerm) {
                performLiveSearch(searchTerm);
            }
        }, 300); // 300ms delay
    });

    // Event listener for search input focus
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            showSearchResults();
        }
    });

    // Event listener to hide results when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            hideSearchResults();
        }
    });

    // Handle form submission
    searchForm.addEventListener('submit', function(e) {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length === 0) {
            e.preventDefault();
            return false;
        }
    });

    // Handle escape key to hide results
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideSearchResults();
            this.blur();
        }
    });

    // Handle arrow keys for navigation (optional enhancement)
    searchInput.addEventListener('keydown', function(e) {
        const items = searchResults.querySelectorAll('.search-result-item');
        let currentIndex = -1;
        
        // Find currently selected item
        items.forEach((item, index) => {
            if (item.classList.contains('selected')) {
                currentIndex = index;
            }
        });

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            e.preventDefault();
            items[currentIndex].click();
            return;
        }

        // Update selection via class; styling handled in CSS
        items.forEach((item, index) => {
            if (index === currentIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    });

    // Add hover effects
    searchResults.addEventListener('mouseover', function(e) {
        if (e.target.closest('.search-result-item')) {
            // Remove keyboard selection when hovering
            const selected = searchResults.querySelector('.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
        }
    });

    // Make submitSearchForm globally accessible
    window.submitSearchForm = submitSearchForm;
});

// Styling is handled in main.css; no inline style injection required
