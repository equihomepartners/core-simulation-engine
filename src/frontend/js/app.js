/**
 * Equihome Fund Simulation Engine
 * Main application JavaScript file
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Equihome Fund Simulation Engine initialized');
    
    // Initialize WebSocket connection
    initWebSocket();
    
    // Add event listeners
    setupEventListeners();
});

/**
 * Initialize WebSocket connection to the backend
 */
function initWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws`;
    
    try {
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = (event) => {
            console.log('WebSocket connection established');
        };
        
        socket.onmessage = (event) => {
            console.log('Message from server:', event.data);
            // Handle incoming messages
        };
        
        socket.onclose = (event) => {
            console.log('WebSocket connection closed');
            // Attempt to reconnect after a delay
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                initWebSocket();
            }, 5000);
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        // Store socket in window for global access
        window.simulationSocket = socket;
    } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
    }
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
    // Example: Create New Simulation button
    const createSimulationBtn = document.querySelector('.primary-button');
    if (createSimulationBtn) {
        createSimulationBtn.addEventListener('click', () => {
            console.log('Create New Simulation clicked');
            // Placeholder for simulation creation logic
            alert('Simulation creation functionality will be implemented in a future update.');
        });
    }
    
    // Example: View Reports button
    const viewReportsBtn = document.querySelector('.secondary-button');
    if (viewReportsBtn) {
        viewReportsBtn.addEventListener('click', () => {
            console.log('View Reports clicked');
            // Placeholder for reports viewing logic
            alert('Reports viewing functionality will be implemented in a future update.');
        });
    }
    
    // Navigation menu items
    const navItems = document.querySelectorAll('nav ul li a');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Prevent default only if the link is a placeholder
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(navItem => navItem.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Placeholder for navigation logic
                console.log(`Navigation: ${item.textContent}`);
                
                if (item.textContent !== 'Dashboard') {
                    alert(`${item.textContent} functionality will be implemented in a future update.`);
                }
            }
        });
    });
}

/**
 * Placeholder for future chart rendering functionality
 * This will be replaced with actual chart rendering code
 */
function renderCharts() {
    console.log('Chart rendering placeholder');
    // This function will be implemented when we add charting libraries
}

/**
 * Send a message to the backend via WebSocket
 * @param {Object} message - The message to send
 */
function sendMessage(message) {
    if (window.simulationSocket && window.simulationSocket.readyState === WebSocket.OPEN) {
        window.simulationSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
}

/**
 * Utility function to format currency values
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(value);
}

/**
 * Utility function to format percentage values
 * @param {number} value - The value to format (e.g., 0.05 for 5%)
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}
