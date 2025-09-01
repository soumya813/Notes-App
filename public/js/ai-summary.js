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

async function summarizeNote() {
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
    summarizeButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
    summarizeButton.disabled = true;

    try {
        const response = await fetch('/dashboard/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text: noteBody,
                noteId: noteId 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
            showToast(data.message || 'Failed to generate summary. Please try again.', 'danger');
        }
    } catch (error) {
        console.error('Summarization Error:', error);
        if (error.message.includes('HTML')) {
            showToast('Authentication error. Please refresh the page and try again.', 'danger');
        } else {
            showToast('Network error occurred. Please check your connection and try again.', 'danger');
        }
    } finally {
        // Restore button state
        summarizeButton.innerHTML = originalButtonContent;
        summarizeButton.disabled = false;
    }
}
