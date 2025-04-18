// tour.js
export function initializeTour() {
    // Check if tour was completed before
    if (!localStorage.getItem('tourCompleted')) {
      setTimeout(startTour, 1500); // Auto-start after 1.5s on first visit
    }
  
    // Manual tour trigger
    document.addEventListener('click', (e) => {
      if (e.target.matches('#start-tour')) {
        startTour();
      }
    });
  }
  
  function startTour() {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        classes: 'glass-intense shadow-xl rounded-xl border border-white/20',
        scrollTo: { behavior: 'smooth', block: 'center' }
      }
    });
  
    // Cleanup function
    function cleanupTour() {
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
      localStorage.setItem('tourCompleted', 'true');
    }
  
    // Common step configuration
    function createStep(config) {
      return {
        ...config,
        buttons: [
          { 
            text: 'Skip', 
            action: () => {
              cleanupTour();
              tour.cancel();
            }
          },
          ...(config.buttons || [])
        ],
        beforeShow: () => {
          document.querySelector(config.element).classList.add('tour-highlight');
        },
        beforeHide: () => {
          document.querySelector(config.element).classList.remove('tour-highlight');
        }
      };
    }
  
    // Tour steps
    tour.addStep(createStep({
      id: 'welcome',
      text: '<div class="text-lg font-medium">Welcome! Let me guide you through key features.</div>',
      element: '#topbar',
      buttons: [
        { text: 'Next', action: tour.next }
      ]
    }));
  
    // Add more steps for your specific elements
    // Example for sidebar items:
    tour.addStep(createStep({
      id: 'dashboard',
      title: 'Dashboard',
      text: 'This is your main dashboard area',
      element: '[data-tour="dashboard"]',
      attachTo: {
        element: '[data-tour="dashboard"]',
        on: 'right'
      },
      buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next }
      ]
    }));
  
    // Final step
    tour.addStep(createStep({
      id: 'complete',
      title: 'Tour Complete!',
      text: 'You\'re now ready to explore. Happy navigating!',
      element: '#start-tour',
      buttons: [
        { 
          text: 'Finish', 
          action: () => {
            cleanupTour();
            tour.complete();
          }
        }
      ]
    }));
  
    // Handle tour cancellation/complete
    tour.on('cancel', cleanupTour);
    tour.on('complete', cleanupTour);
  
    // Start the tour
    tour.start();
  }
  
  // Add this to your main CSS or create a tour.css file
  export const tourStyles = `
    .glass-intense {
      background: rgba(255, 255, 255, 0.08) !important;
      backdrop-filter: blur(25px) !important;
      -webkit-backdrop-filter: blur(25px) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
    }
    .tour-highlight {
      animation: pulse 2s infinite;
      position: relative;
      z-index: 50;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
  `;