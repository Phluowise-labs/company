// Global variables (declare only once at the top)
let ordersData = [];
let selectedOrderIndex = -1;

// Load orders from localStorage or JSON file
// Load orders from JSON file
async function loadOrders() {
  try {
    // Commented out localStorage logic
    // const savedData = localStorage.getItem("ordersData");
    // if (savedData) {
    //   ordersData = JSON.parse(savedData);
    // } else {
    const response = await fetch("get_return_pickups.json"); // or your API endpoint
    const data = await response.json();
    ordersData = data.orders;
    // }

    renderOrders();
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

// Render orders to the DOM
function renderOrders() {
  const pendingContainer = document.getElementById("pendingOrdersContainer");
  const acceptedContainer = document.getElementById("acceptedOrdersContainer");
  pendingContainer.innerHTML = "";
  acceptedContainer.innerHTML = "";

  ordersData.forEach((order, index) => {
    const card = createOrderCard(order, index);
    if (order.status === "pending") {
      pendingContainer.innerHTML += card;
    } else {
      acceptedContainer.innerHTML += card;
    }
  });
}

// Helper function to create order card HTML
function createOrderCard(order, index) {
  return `
    <div class="bg-[#212121] rounded-lg p-4 w-full">
      <div class="flex">
        <div class="mr-4">
          <div class="w-16 h-16 bg-blue-100 rounded-md flex items-center justify-center">
            <img src="${
              order.image
            }" alt="Water bottle" class="w-12 h-12 text-blue-500">
          </div>
          <p class="text-white text-center text-xs mt-1">${order.size}</p>
        </div>

        <div class="flex-1">
          <p class="text-white font-medium">${order.user}</p>
        
          ${
            order.status === "accepted" && order.pickupDate
              ? `
            <div class="mt-2">
              <p class="text-gray-400 text-xs font-semibold">Scheduled Pickup:</p>
              <p class="text-gray-400 text-xs">${order.pickupDate} at ${
                  order.pickupTime
                }</p>
              ${
                order.additionalInfo
                  ? `<p class="text-gray-200 text-xs mt-1">${order.additionalInfo}</p>`
                  : ""
              }
            </div>`
              : `
            <div class="flex items-center mt-1">
              <p class="text-gray-400 text-xs">${order.time}</p>
              <p class="text-gray-400 text-xs ml-2">${order.date}</p>
            </div>`
          }
          <div class="flex gap-2 mt-2">
            <span class="bg-green-900 text-white text-xs rounded px-2 py-1">${
              order.price
            }</span>
            <span class="bg-zinc-800 text-white text-xs rounded px-2 py-1">${
              order.type
            }</span>
          </div>
        </div>

        <div class="flex flex-col items-center ml-2">
          <div class="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                            <img src="../../images/location.svg" alt="">
                          </div>
          <p class="text-white text-xs mt-1 text-center">${order.location}</p>
        </div>
      </div>

      ${
        order.status === "pending"
          ? `
        <div class="flex gap-2 mt-4">
          <button class="bg-blue-700 text-white rounded py-2 px-6 flex-1" onclick="openModal(${index})">Accept</button>
          <button class="bg-zinc-800 text-white rounded-full w-8 h-8 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
        </div>`
          : ""
      }
    </div>`;
}

// Tab management
function showTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.toggle(
      "bg-blue-900",
      btn.getAttribute("onclick").includes(tabId)
    );
    btn.classList.toggle(
      "bg-gray-800",
      !btn.getAttribute("onclick").includes(tabId)
    );
  });
}

// Modal functions
function openModal(index) {
  selectedOrderIndex = index;
  console.log("Opening modal for order:", index, ordersData[index]);
  document.getElementById("acceptModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("acceptModal").classList.add("hidden");
}

function confirmAccept() {
  if (selectedOrderIndex === -1) {
    alert("No order selected! Please try again.");
    return;
  }
  closeModal();
  openPickupModal();
}

function openPickupModal() {
  // Reset form fields
  document.getElementById("datePicker").value = "";
  document.getElementById("timePicker").value = "";
  document.getElementById("additionalInfo").value = "";
  document.getElementById("set_pickup_date").classList.remove("hidden");
}

function closePickupModal() {
  document.getElementById("set_pickup_date").classList.add("hidden");
}

function savePickupDetails() {
  const date = document.getElementById("datePicker").value;
  const time = document.getElementById("timePicker").value;

  if (selectedOrderIndex === -1) {
    alert("Error: No order selected. Please start over.");
    return;
  }

  if (!date || !time) {
    alert("Please select both date and time");
    return;
  }

  // Update the order
  ordersData[selectedOrderIndex] = {
    ...ordersData[selectedOrderIndex],
    status: "accepted",
    pickupDate: date,
    pickupTime: time,
    additionalInfo: document.getElementById("additionalInfo").value,
  };

  // Commented out saving to localStorage
  // localStorage.setItem("ordersData", JSON.stringify(ordersData));

  // TODO: Replace with API call or file write function
  // async function saveOrdersToAPI(ordersData) {
  //   await fetch("your-api-endpoint", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(ordersData)
  //   });
  // }

  // Update UI
  closePickupModal();
  renderOrders();
  showTab("accepted");
  alert("Pickup scheduled successfully!");

  // Reset selection
  selectedOrderIndex = -1;
}

// Initialize date/time pickers
function initPickers() {
  flatpickr("#datePicker", {
    dateFormat: "l, F j, Y",
    defaultDate: new Date(),
    disableMobile: true,
  });

  flatpickr("#timePicker", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "h:i K",
    defaultDate: "12:00 PM",
  });
}

// Initialize the application
window.onload = function () {
  initPickers();
  loadOrders();
  showTab("pending");
};
