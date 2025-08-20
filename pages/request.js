// Sample data with 12 example orders
const orderData = {
    "orders": [
        {
            "id": 1,
            "name": "John Doe",
            "location": "New York",
            "time": "10:30am",
            "date": "July 22, 2023",
            "status": "pending",
            "total": 24.00,
            "notes": "Please deliver to the back entrance. Call when you arrive.",
            "products": [
                {
                    "name": "Sachets water",
                    "description": "500ml",
                    "price": 10.00,
                    "quantity": 2,
                    "image": "https://via.placeholder.com/80"
                },
                {
                    "name": "Dispenser Bottle",
                    "description": "20L",
                    "price": 12.00,
                    "quantity": 1,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "location": "Los Angeles",
            "time": "2:15pm",
            "date": "July 21, 2023",
            "status": "pending",
            "total": 45.50,
            "notes": "Leave at front desk if I'm not home",
            "products": [
                {
                    "name": "Mineral Water",
                    "description": "1L bottle",
                    "price": 15.50,
                    "quantity": 3,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 3,
            "name": "Robert Johnson",
            "location": "Chicago",
            "time": "9:45am",
            "date": "July 23, 2023",
            "status": "pending",
            "total": 32.00,
            "notes": "Ring doorbell twice",
            "products": [
                {
                    "name": "Sparkling Water",
                    "description": "750ml",
                    "price": 8.00,
                    "quantity": 4,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 4,
            "name": "Emily Wilson",
            "location": "Miami",
            "time": "4:20pm",
            "date": "July 20, 2023",
            "status": "pending",
            "total": 28.50,
            "notes": "Call before delivery",
            "products": [
                {
                    "name": "Purified Water",
                    "description": "1 gallon",
                    "price": 5.50,
                    "quantity": 2,
                    "image": "https://via.placeholder.com/80"
                },
                {
                    "name": "Glass Bottles",
                    "description": "500ml",
                    "price": 12.00,
                    "quantity": 1,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 5,
            "name": "Michael Brown",
            "location": "Seattle",
            "time": "11:10am",
            "date": "July 24, 2023",
            "status": "pending",
            "total": 36.00,
            "notes": "Leave with receptionist",
            "products": [
                {
                    "name": "Alkaline Water",
                    "description": "1L",
                    "price": 12.00,
                    "quantity": 3,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 6,
            "name": "Sarah Davis",
            "location": "Boston",
            "time": "3:45pm",
            "date": "July 25, 2023",
            "status": "pending",
            "total": 42.00,
            "notes": "Weekend delivery preferred",
            "products": [
                {
                    "name": "Spring Water",
                    "description": "5 gallon",
                    "price": 14.00,
                    "quantity": 3,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 7,
            "name": "David Miller",
            "location": "Houston",
            "time": "1:30pm",
            "date": "July 26, 2023",
            "status": "pending",
            "total": 19.50,
            "notes": "Gate code is 1234",
            "products": [
                {
                    "name": "Distilled Water",
                    "description": "1 gallon",
                    "price": 6.50,
                    "quantity": 3,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 8,
            "name": "Jessica Wilson",
            "location": "Phoenix",
            "time": "10:15am",
            "date": "July 27, 2023",
            "status": "pending",
            "total": 27.00,
            "notes": "Please knock loudly",
            "products": [
                {
                    "name": "Mineral Water",
                    "description": "750ml",
                    "price": 9.00,
                    "quantity": 3,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 9,
            "name": "Daniel Moore",
            "location": "Philadelphia",
            "time": "2:00pm",
            "date": "July 28, 2023",
            "status": "pending",
            "total": 33.50,
            "notes": "Back porch delivery",
            "products": [
                {
                    "name": "Sparkling Water",
                    "description": "1L",
                    "price": 11.50,
                    "quantity": 1,
                    "image": "https://via.placeholder.com/80"
                },
                {
                    "name": "Still Water",
                    "description": "1L",
                    "price": 8.00,
                    "quantity": 2,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 10,
            "name": "Lisa Taylor",
            "location": "San Antonio",
            "time": "4:45pm",
            "date": "July 29, 2023",
            "status": "pending",
            "total": 24.00,
            "notes": "Call upon arrival",
            "products": [
                {
                    "name": "Purified Water",
                    "description": "500ml",
                    "price": 6.00,
                    "quantity": 4,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 11,
            "name": "Mark Anderson",
            "location": "San Diego",
            "time": "9:30am",
            "date": "July 30, 2023",
            "status": "pending",
            "total": 38.00,
            "notes": "Leave at side door",
            "products": [
                {
                    "name": "Mineral Water",
                    "description": "1L",
                    "price": 9.50,
                    "quantity": 4,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        },
        {
            "id": 12,
            "name": "Nancy Thomas",
            "location": "Dallas",
            "time": "11:45am",
            "date": "July 31, 2023",
            "status": "pending",
            "total": 21.00,
            "notes": "No contact delivery",
            "products": [
                {
                    "name": "Spring Water",
                    "description": "500ml",
                    "price": 7.00,
                    "quantity": 3,
                    "image": "https://via.placeholder.com/80"
                }
            ]
        }
    ],
    "accepted": [],
    "pending": [],
    "denied": []
};

// --- Real API integration ---
const BASE_URL = "https://phluowise.azurewebsites.net";
const API_BASE = `${BASE_URL}/api/order`;
function getAuthToken() {
	return localStorage.getItem("authToken");
}
function getCompanyId() {
	try {
		const raw = localStorage.getItem("loggedInCompany");
		if (!raw) return null;
		const obj = JSON.parse(raw);
		return obj?.id || null;
	} catch {
		return null;
	}
}
function authHeaders() {
	const token = getAuthToken();
	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}
// Debug helpers to standardize logs
function debugLog(message, data) {
	try {
		if (data !== undefined) {
			console.log(`[Requests] ${message}`, data);
		} else {
			console.log(`[Requests] ${message}`);
		}
	} catch (_) {
		console.log(`[Requests] ${message}`);
	}
}
function debugError(message, error) {
	try {
		console.error(`[Requests] ${message}`, error);
	} catch (_) {
		console.error(`[Requests] ${message}`);
	}
}
async function fetchCompanyOrders(companyId) {
	const url = `${API_BASE}/get-company-order`;
	const reqInit = {
		method: "POST",
		headers: authHeaders(),
		body: JSON.stringify({ companyId }),
	};
	debugLog("Fetching company orders – endpoint", url);
	debugLog("Request init", reqInit);
	const res = await fetch(url, reqInit);
	const data = await res.json().catch(() => null);
	debugLog("Fetch company orders – status", { status: res.status, ok: res.ok });
	debugLog("Fetch company orders – response", data);
	if (!res.ok) {
		const msg = data?.message || data?.detail || res.statusText;
		throw new Error(msg);
	}
	return Array.isArray(data) ? data : (data?.orders || []);
}
async function setOrderStatus(companyId, orderId, status) {
	const url = `${API_BASE}/set-order-by-company-status`;
	const reqInit = {
		method: "POST",
		headers: authHeaders(),
		body: JSON.stringify({ companyId, orderId, status }),
	};
	debugLog("Updating order status – endpoint", url);
	debugLog("Updating order status – payload", { companyId, orderId, status });
	const res = await fetch(url, reqInit);
	const data = await res.json().catch(() => null);
	debugLog("Update order status – status", { status: res.status, ok: res.ok });
	debugLog("Update order status – response", data);
	if (!res.ok) {
		const msg = data?.message || data?.detail || res.statusText;
		throw new Error(msg);
	}
	return data;
}
function toTitleCase(value) {
	if (!value) return "";
	return String(value).split(" ").filter(Boolean).map(p => p[0]?.toUpperCase() + p.slice(1)).join(" ");
}
function toDisplayDate(dateLike) {
	if (!dateLike) return "";
	const d = new Date(dateLike);
	if (Number.isNaN(d.getTime())) return String(dateLike);
	return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" });
}
function toDisplayTime(dateLike) {
	if (!dateLike) return "";
	const d = new Date(dateLike);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function normalizeOrder(raw) {
	const id = raw?.id || raw?.orderId || raw?.orderID || raw?._id || String(Math.random());
	const customerName = raw?.name || raw?.customerName || raw?.userName || "Unknown";
	const location = raw?.location || raw?.address || raw?.pickupLocation || "";
	const createdAt = raw?.createdAt || raw?.createdDate || raw?.date || raw?.timestamp;
	const date = toDisplayDate(createdAt) || raw?.date || "";
	const time = toDisplayTime(createdAt) || raw?.time || "";
	const status = (raw?.status || "pending").toLowerCase();
	const notes = raw?.additionalInfo || raw?.notes || "";
	const products = Array.isArray(raw?.products) ? raw.products.map(p => ({
		name: p?.name || p?.productName || "Product",
		description: p?.description || p?.type || "",
		price: Number(p?.price || 0),
		quantity: Number(p?.quantity || 0),
		image: p?.image || p?.imageUrl || "https://via.placeholder.com/80",
	})) : [];
	const total = raw?.total ?? products.reduce((s, p) => s + (p.price * p.quantity), 0);
	return { id, name: toTitleCase(customerName), location, date, time, status, total: Number(total || 0), notes, products, __raw: raw };
}

document.addEventListener('DOMContentLoaded', function() {
    // Log environment context
    debugLog("DOM loaded for Requests page");
    debugLog("Base URL", BASE_URL);
    debugLog("API base", API_BASE);
    debugLog("Auth token present", Boolean(getAuthToken()));
    debugLog("Logged in company", (() => { try { return JSON.parse(localStorage.getItem('loggedInCompany')||'null'); } catch { return null; } })());
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and panes
            document.querySelectorAll('.tab-button').forEach(t => {
                t.classList.remove('active', 'text-white', 'border-b-2', 'border-blue-500');
                t.classList.add('text-gray-400');
            });
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active', 'text-white', 'border-b-2', 'border-blue-500');
            this.classList.remove('text-gray-400');
            const paneId = this.id.replace('-tab', '-content');
            document.getElementById(paneId).classList.remove('hidden');
            debugLog("Tab switched", { tabId: this.id, paneId });
        });
    });

    // Auth guard
    const token = getAuthToken();
    const companyId = getCompanyId();
    if (!token || !companyId) {
        debugError("Auth guard failed", { hasToken: Boolean(token), companyId });
        Swal.fire({
            icon: 'error',
            title: 'Not authorized',
            text: 'Please sign in to view and manage orders.',
            confirmButtonText: 'Go to Sign in'
        }).then(() => {
            window.location.href = 'user-signin.html';
        });
        return;
    }

    // Initialize containers
    const ordersContainer = document.getElementById('orders-container');
    const acceptedContainer = document.getElementById('accepted-container');
    const pendingContainer = document.getElementById('pending-container');
    const deniedContainer = document.getElementById('denied-container');
    const orderTemplate = document.getElementById('order-template');
    const modalTemplate = document.getElementById('modal-template');

    // Create and append modal to body
    const modal = modalTemplate.content.cloneNode(true);
    document.body.appendChild(modal);

    // Get modal elements after they're added to DOM
    const modalElement = document.querySelector('.modal');
    const closeModalBtn = modalElement.querySelector('.close-modal-btn');
    const productsSlider = modalElement.querySelector('.products-slider');
    const totalPriceElement = modalElement.querySelector('.total-price');
    const orderDateModal = modalElement.querySelector('.order-date-modal');
    const orderTimeModal = modalElement.querySelector('.order-time-modal');
    const notesElement = modalElement.querySelector('.notes');

    // Modal functions
    function showModal(order) {
        // Clear previous products
        productsSlider.innerHTML = '';
        
        // Add products to slider with smooth horizontal scrolling
        order.products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product-slide';
            productElement.innerHTML = `
                <div class="border border-gray-700 rounded-lg overflow-hidden">
                    <div class="flex p-2">
                        <img src="${product.image}" alt="${product.name}" class="w-20 h-20 object-cover rounded"/>
                        <div class="ml-2">
                            <p class="font-medium">${product.name}</p>
                            <p class="text-sm text-gray-400">${product.description}</p>
                        </div>
                    </div>
                    <div class="border-t border-gray-700 p-3">
                        <div class="flex justify-between items-center mb-2">
                            <p class="text-sm">${product.quantity} ${product.quantity > 1 ? product.name + 's' : product.name}</p>
                            <div>
                                <p class="text-xs text-gray-400">Price:</p>
                                <p class="font-medium">GH₵ ${product.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="bg-gray-900 p-3 rounded text-center">
                            <p class="text-sm mb-1">Number of purchase</p>
                            <p class="text-xl font-semibold">${product.quantity}</p>
                        </div>
                    </div>
                </div>
            `;
            productsSlider.appendChild(productElement);
        });
        
        // Set order details
        totalPriceElement.textContent = `GH₵ ${order.total.toFixed(2)}`;
        orderDateModal.textContent = order.date;
        orderTimeModal.textContent = order.time;
        notesElement.textContent = order.notes || 'No additional notes';
        
        // Show modal and prevent body scrolling
        modalElement.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        modalElement.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Event listeners for modal
    closeModalBtn.addEventListener('click', hideModal);
    
    // Close modal when clicking outside
    modalElement.addEventListener('click', function(e) {
        if (e.target === modalElement) {
            hideModal();
        }
    });

    // Function to create an order card
    function createOrderCard(order, container, showButtons = true) {
        const card = orderTemplate.content.cloneNode(true);
        const orderCard = card.querySelector('.order-card');
        orderCard.dataset.id = order.id;
        orderCard.querySelector('.order-name').textContent = order.name;
        orderCard.querySelector('.order-location').textContent = order.location;
        orderCard.querySelector('.order-time').textContent = order.time;
        orderCard.querySelector('.order-date').textContent = order.date;
        
        // Set avatar initials
        const avatar = orderCard.querySelector('.avatar-placeholder');
        const initials = order.name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatar.textContent = initials;
        
        // Set up view details button
        const viewDetailsBtn = orderCard.querySelector('.view-details-btn');
        viewDetailsBtn.addEventListener('click', () => {
            debugLog("Open modal for order", order);
            showModal(order);
        });
        
        // Only show action buttons if specified
        if (showButtons) {
            const acceptBtn = orderCard.querySelector('.accept-btn');
            const denyBtn = orderCard.querySelector('.deny-btn');
            const pendingBtn = orderCard.querySelector('.pending-btn');
            
            acceptBtn.addEventListener('click', async () => {
                debugLog("Accept clicked", { orderId: order.id, currentStatus: order.status });
                const { isConfirmed } = await Swal.fire({
                    title: 'Accept Order?',
                    text: "This will move the order to Accepted tab",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#10B981',
                    confirmButtonText: 'Yes, accept it!',
                    cancelButtonText: 'Cancel',
                    position: 'center'
                });
                
                if (isConfirmed) {
                    try {
                        await setOrderStatus(companyId, order.id, 'accepted');
                        order.status = 'accepted';
                        moveOrder(order, orderCard, acceptedContainer, 'accepted');
                    } catch (e) {
                        debugError("Accept failed", e);
                        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to accept order' });
                    }
                }
            });
            
            denyBtn.addEventListener('click', async () => {
                debugLog("Deny clicked", { orderId: order.id, currentStatus: order.status });
                const { isConfirmed } = await Swal.fire({
                    title: 'Deny Order?',
                    text: "This will move the order to Denied tab",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#EF4444',
                    confirmButtonText: 'Yes, deny it!',
                    cancelButtonText: 'Cancel',
                    position: 'center'
                });
                
                if (isConfirmed) {
                    try {
                        await setOrderStatus(companyId, order.id, 'rejected');
                        order.status = 'rejected';
                        moveOrder(order, orderCard, deniedContainer, 'denied');
                    } catch (e) {
                        debugError("Deny failed", e);
                        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to deny order' });
                    }
                }
            });
            
            pendingBtn.addEventListener('click', async () => {
                debugLog("Pending clicked", { orderId: order.id, currentStatus: order.status });
                const { isConfirmed } = await Swal.fire({
                    title: 'Mark as Pending?',
                    text: "This will move the order to Pending tab",
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#F59E0B',
                    confirmButtonText: 'Yes, mark pending!',
                    cancelButtonText: 'Cancel',
                    position: 'center'
                });
                
                if (isConfirmed) {
                    try {
                        await setOrderStatus(companyId, order.id, 'pending');
                        order.status = 'pending';
                        moveOrder(order, orderCard, pendingContainer, 'pending');
                    } catch (e) {
                        debugError("Mark pending failed", e);
                        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to mark pending' });
                    }
                }
            });
        } else {
            const actionButtons = orderCard.querySelector('.action-buttons');
            if (actionButtons) actionButtons.remove();
        }
        
        container.appendChild(card);
    }

    // Function to move order between containers
    function moveOrder(order, orderCard, targetContainer, newStatus) {
        // Remove from current container
        orderCard.remove();
        
        // Update order status
        order.status = newStatus;
        
        // Show success notification
        Swal.fire({
            title: 'Success!',
            text: `Order has been moved to ${newStatus}`,
            icon: 'success',
            confirmButtonText: 'OK',
            position: 'center'
        });
        
        // Add to target container without buttons
        createOrderCard(order, targetContainer, false);
        
        // In a real app, you would send this update to your backend
        debugLog("Order moved", { orderId: order.id, newStatus });
    }

    // Initialize the app with live data
    async function initializeApp() {
        debugLog("Initialize app – start");
        // Clear all containers
        ordersContainer.innerHTML = '';
        acceptedContainer.innerHTML = '';
        pendingContainer.innerHTML = '';
        deniedContainer.innerHTML = '';
        try {
            const rawOrders = await fetchCompanyOrders(companyId);
            debugLog("Raw orders received", rawOrders);
            const orders = rawOrders.map(normalizeOrder);
            debugLog("Normalized orders", orders);
            // All orders list (buttons only for pending)
            orders.forEach(o => {
                const showButtons = (o.status || 'pending').toLowerCase() === 'pending';
                createOrderCard(o, ordersContainer, showButtons);
            });
            orders.filter(o => (o.status || '').toLowerCase() === 'accepted')
                .forEach(o => createOrderCard(o, acceptedContainer, false));
            orders.filter(o => (o.status || '').toLowerCase() === 'pending')
                .forEach(o => createOrderCard(o, pendingContainer, false));
            orders.filter(o => { const s = (o.status || '').toLowerCase(); return s === 'rejected' || s === 'denied'; })
                .forEach(o => createOrderCard(o, deniedContainer, false));
            if (orders.length === 0) {
                ordersContainer.innerHTML = `<div class="text-gray-400 text-center py-6">No orders yet</div>`;
            }
        } catch (err) {
            debugError("Initialize app failed", err);
            ordersContainer.innerHTML = `<div class=\"text-red-400 text-center py-6\">Failed to load orders. ${err.message}</div>`;
        }
        debugLog("Initialize app – end");
    }

    // Start the app
    initializeApp();
});