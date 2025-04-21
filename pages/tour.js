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
            classes: 'shepherd-theme-custom',
            scrollTo: { behavior: 'smooth', block: 'center' },
            when: {
                show: function() {
                    const currentElement = document.querySelector(this.options.attachTo.element);
                    if (currentElement) {
                        currentElement.classList.add('tour-highlight');
                    }
                },
                hide: function() {
                    const currentElement = document.querySelector(this.options.attachTo.element);
                    if (currentElement) {
                        currentElement.classList.remove('tour-highlight');
                    }
                }
            }
        }
    });

    // Add steps for all navigation items
    const tourSteps = [
        // Welcome
        {
            id: 'welcome',
            text: 'Welcome to Phluowise Dashboard! Let me guide you through the features.',
            buttons: [{ text: 'Next', action: tour.next }]
        },
        
        // Dashboard Section
        {
            id: 'dashboard-section',
            title: 'Dashboard',
            text: 'Your main navigation area',
            attachTo: { element: '.sidebar h2:first-of-type', on: 'right' }
        },
        {
            id: 'home',
            title: 'Home (Coming Soon)',
            text: 'Dashboard overview coming in version 2.0',
            attachTo: { element: '[data-page="home"]', on: 'right' }
        },
        {
            id: 'add-drivers',
            title: 'Add Drivers',
            text: 'Create and manage driver accounts here',
            attachTo: { element: '[data-page="add_driver"]', on: 'right' }
        },
        
        // Messaging Section
        {
            id: 'messaging-section',
            title: 'Messaging',
            text: 'Communication tools',
            attachTo: { element: '.sidebar h2:nth-of-type(2)', on: 'right' }
        },
        {
            id: 'chat',
            title: 'Chat (Coming Soon)',
            text: 'In-app messaging coming soon',
            attachTo: { element: '[data-page="chat"]', on: 'right' }
        },
        {
            id: 'rating',
            title: 'Ratings',
            text: 'View customer feedback and ratings',
            attachTo: { element: '[data-page="rating"]', on: 'right' }
        },
        
        // Account Section
        {
            id: 'account-section',
            title: 'Account',
            text: 'Business analytics and financials',
            attachTo: { element: '.sidebar h2:nth-of-type(3)', on: 'right' }
        },
        {
            id: 'account',
            title: 'Account Analytics',
            text: 'View order stats and pickup requests',
            attachTo: { element: '[data-page="account"]', on: 'right' }
        },
        {
            id: 'transactions',
            title: 'Transactions',
            text: 'Complete transaction history',
            attachTo: { element: '[data-page="transactions"]', on: 'right' }
        },
        {
            id: 'subscription',
            title: 'Subscription',
            text: 'Manage your service plan',
            attachTo: { element: '[data-page="subscription"]', on: 'right' }
        },
        
        // Pickups Section
        {
            id: 'pickups-section',
            title: 'Pickups',
            text: 'Order and return management',
            attachTo: { element: '.sidebar h2:nth-of-type(4)', on: 'right' }
        },
        {
            id: 'requests',
            title: 'Order Requests',
            text: 'Manage customer orders',
            attachTo: { element: '[data-page="requests"]', on: 'right' }
        },
        {
            id: 'return-pickups',
            title: 'Return Pickups',
            text: 'Schedule bottle retrievals',
            attachTo: { element: '[data-page="get_return_pickups"]', on: 'right' }
        },
        {
            id: 'driver-app',
            title: 'Driver App (Coming Soon)',
            text: 'Mobile app for drivers coming soon',
            attachTo: { element: '[data-page="get_driver_app"]', on: 'right' }
        },
        
        // Final Step
        {
            id: 'complete',
            title: 'Tour Complete!',
            text: 'You\'re ready to use Phluowise Dashboard',
            buttons: [{ text: 'Finish', action: tour.complete }]
        }
    ];

    // Add all steps to the tour
    tourSteps.forEach(step => tour.addStep({
        ...step,
        buttons: [
            ...(step.buttons || []),
            ...(step.id !== 'welcome' && step.id !== 'complete' ? [
                { text: 'Back', action: tour.back, classes: 'shepherd-button-secondary' },
                { text: 'Next', action: tour.next }
            ] : [])
        ]
    }));

    // Cleanup on complete/cancel
    tour.on('complete', () => {
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
        localStorage.setItem('tourCompleted', 'true');
    });
    tour.on('cancel', () => {
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
        localStorage.setItem('tourCompleted', 'true');
    });

    tour.start();
}
