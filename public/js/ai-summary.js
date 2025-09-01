// public/js/ai-summary.js

document.addEventListener('DOMContentLoaded', function() {
  const summarizeButton = document.getElementById('summarizeButton');
  const regenerateButton = document.getElementById('regenerateButton');
  
  if (summarizeButton) {
    summarizeButton.addEventListener('click', summarizeNote);
  }
  
  if (regenerateButton) {
    regenerateButton.addEventListener('click', summarizeNote);
  }
  
  // Handle toast close buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('toast-close-btn')) {
      e.target.closest('.toast').remove();
    }
  });
  
  // Handle server messages only on pages that have the server-msgs element
  const serverMsgsEl = document.getElementById('server-msgs');
  if (serverMsgsEl) {
    try {
      const serverMsgs = JSON.parse(serverMsgsEl.textContent || '{}');
      // Only show messages if they exist and aren't empty
      if (serverMsgs.success && serverMsgs.success.trim()) {
        showToast(serverMsgs.success, 'success');
      }
      if (serverMsgs.error && serverMsgs.error.trim()) {
        showToast(serverMsgs.error, 'danger');
      }
    } catch (e) {
      // Silently ignore JSON parse errors
    }
  }
  
  // Make showToast globally available
  window.showToast = showToast;
});

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = createToastContainer();
    }

    const toast = document.createElement('div');
    toast.className = `toast show bg-${type} text-white`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto toast-close-btn"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
}

async function summarizeNote(isRetry = false) {
    const noteBody = document.getElementById('body').value;
    const summarizeButton = document.getElementById('summarizeButton');
    const summarySection = document.getElementById('summarySection');
    const summaryContent = document.getElementById('summaryContent');
    // Get noteId from global variable set by EJS template
    const noteId = window.NOTE_ID || document.body.dataset.noteId || window.location.pathname.split('/').pop();

    if (!noteBody.trim()) {
        showToast('Please add some content to your note before summarizing.', 'warning');
        return;
    }

    if (noteBody.trim().length < 50) {
        showToast('Note content is too short for meaningful summarization. Please add more content.', 'warning');
        return;
    }

    // Update button state with loading animation
    const originalButtonContent = summarizeButton.innerHTML;
    const loadingText = isRetry ? 'Retrying...' : 'Generating...';
    summarizeButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
    summarizeButton.disabled = true;

    try {
        const response = await fetch('/dashboard/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin', // Include session cookies
            body: JSON.stringify({ 
                text: noteBody,
                noteId: noteId 
            })
        });

        // Check if response is HTML (redirect/error page)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned HTML instead of JSON - likely an authentication error');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.success && data.summary && data.summary.trim()) {
            // Update summary content with fade effect
            summaryContent.style.opacity = '0.5';
            
            setTimeout(() => {
                summaryContent.textContent = data.summary;
                summaryContent.style.opacity = '1';
            }, 200);

            // Show summary section with slide animation
            if (summarySection.classList.contains('d-none')) {
                summarySection.classList.remove('d-none');
                summarySection.style.opacity = '0';
                summarySection.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    summarySection.style.transition = 'all 0.3s ease';
                    summarySection.style.opacity = '1';
                    summarySection.style.transform = 'translateY(0)';
                }, 10);
            }

            // Smooth scroll to summary
            setTimeout(() => {
                summarySection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);

            showToast('Summary generated and saved successfully!', 'success');
        } else {
            const errorMsg = data.message || data.error || 'Failed to generate summary. Please try again.';
            handleSummaryError(errorMsg, isRetry);
        }
    } catch (error) {
        console.error('Summarization Error:', error);
        handleSummaryError(error.message, isRetry);
    } finally {
        // Restore button state
        summarizeButton.innerHTML = originalButtonContent;
        summarizeButton.disabled = false;
    }
}

function handleSummaryError(errorMessage, isRetry) {
    let userMessage = 'Network error occurred. Please try again.';
    let canRetry = false;
    
    if (errorMessage.includes('HTML instead of JSON')) {
        userMessage = 'Please refresh the page and try again. (Session may have expired)';
    } else if (errorMessage.includes('temporarily unavailable') || errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
        userMessage = 'AI service is temporarily busy. ';
        canRetry = !isRetry; // Only show retry option if this isn't already a retry
        if (canRetry) {
            userMessage += 'Would you like to try again?';
        } else {
            userMessage += 'Please try again in a few moments.';
        }
    } else if (errorMessage.includes('timeout') || errorMessage.includes('503')) {
        userMessage = 'AI service is loading. ';
        canRetry = !isRetry;
        if (canRetry) {
            userMessage += 'Would you like to try again?';
        } else {
            userMessage += 'Please wait a moment and try again.';
        }
    } else if (errorMessage.includes('429') || errorMessage.includes('Too many requests')) {
        userMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage = 'Authentication error. Please refresh the page and try again.';
    } else if (errorMessage.includes('API key not configured') || errorMessage.includes('Hugging Face')) {
        userMessage = 'AI summarization service is not configured. Please contact the administrator.';
    }
    
    if (canRetry) {
        showRetryToast(userMessage);
    } else {
        showToast(userMessage, 'danger');
    }
}

function showRetryToast(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = createToastContainer();
    }

    const toast = document.createElement('div');
    toast.className = 'toast show bg-warning text-dark';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-body">
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span>${message}</span>
            </div>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-dark retry-btn">
                    <i class="fas fa-redo me-1"></i>Retry
                </button>
                <button type="button" class="btn btn-sm btn-outline-dark toast-close-btn">Cancel</button>
            </div>
        </div>
    `;
    
    const retryBtn = toast.querySelector('.retry-btn');
    retryBtn.addEventListener('click', () => {
        toast.remove();
        summarizeNote(true); // Retry with flag
    });
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 10 seconds if no action
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 10000);
}
