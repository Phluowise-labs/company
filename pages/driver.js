// Driver Management Script
let drivers = [];
let editingDriverId = null;

// Generate a unique ID for drivers
function generateDriverId() {
  return 'DRV-' + Math.floor(100000 + Math.random() * 900000);
}

// Format driver data from form
function getDriverData() {
  return {
    id: document.getElementById('driverId').value || generateDriverId(),
    publicName: document.getElementById('publicName').value,
    driverName: document.getElementById('driverName').value,
    phoneNumber: document.getElementById('phoneNumber').value,
    emailAddress: document.getElementById('emailAddress').value,
    residence: document.getElementById('residence').value,
    vehicleNumber: document.getElementById('vehicleNumber').value,
    vehicleType: document.getElementById('vehicleType').value,
    driverID: document.getElementById('driverID').value,
    idType: document.getElementById('idType').value,
    idNumber: document.getElementById('idNumber').value,
    profileImage: document.getElementById('previewImage').src || '',
    frontIdImage: document.getElementById('frontIdPreview').src || '',
    backIdImage: document.getElementById('backIdPreview').src || ''
  };
}

// Reset form
function resetForm() {
  // Reset form fields
  document.getElementById('driverForm').reset();
  
  // Reset image previews
  const previewImage = document.getElementById('previewImage');
  const frontIdPreview = document.getElementById('frontIdPreview');
  const backIdPreview = document.getElementById('backIdPreview');
  
  previewImage.src = '';
  previewImage.style.display = 'none';
  frontIdPreview.src = '';
  frontIdPreview.style.display = 'none';
  backIdPreview.src = '';
  backIdPreview.style.display = 'none';
  
  // Reset upload placeholders
  document.querySelector('.image-upload p').style.display = 'block';
  document.querySelector('#frontIdUpload .upload-icon').style.display = 'block';
  document.querySelector('#backIdUpload .upload-icon').style.display = 'block';
  document.querySelector('#frontIdUpload p').style.display = 'block';
  document.querySelector('#backIdUpload p').style.display = 'block';
  
  // Reset form state
  document.getElementById('driverId').value = '';
  editingDriverId = null;
  
  // Update UI elements
  const addButton = document.getElementById('addDriver');
  const cancelButton = document.getElementById('cancelEdit');
  
  addButton.textContent = 'Add Driver';
  addButton.style.background = 'var(--primary)';
  cancelButton.style.display = 'none';
  
  // Clear file inputs
  document.getElementById('profileImage').value = '';
  document.getElementById('frontIdImage').value = '';
  document.getElementById('backIdImage').value = '';
  
  // Force a reflow to ensure all styles are applied
  void document.body.offsetHeight;
}

// Save driver (add or update)
function saveDriver(driverData) {
  try {
    if (editingDriverId) {
      // Update existing driver
      const index = drivers.findIndex(d => d.id === editingDriverId);
      if (index !== -1) {
        drivers[index] = { ...driverData };
      }
    } else {
      // Add new driver
      drivers.push(driverData);
    }
    
    // Save to localStorage (or send to API in a real app)
    localStorage.setItem('drivers', JSON.stringify(drivers));
    
    // Update UI
    renderDriversList();
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: `Driver ${editingDriverId ? 'updated' : 'added'} successfully`,
      timer: 2000,
      showConfirmButton: false
    });
    
    // Reset the form after a short delay to show the success message
    setTimeout(() => {
      resetForm();
    }, 500);
    
  } catch (error) {
    console.error('Error saving driver:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to save driver. Please try again.'
    });
  }
}

// Delete driver
function deleteDriver(driverId) {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      drivers = drivers.filter(driver => driver.id !== driverId);
      localStorage.setItem('drivers', JSON.stringify(drivers));
      renderDriversList();
      
      Swal.fire(
        'Deleted!',
        'Driver has been deleted.',
        'success'
      );
    }
  });
}

// Populate form for editing
function editDriver(driverId) {
  const driver = drivers.find(d => d.id === driverId);
  if (!driver) return;
  
  editingDriverId = driverId;
  
  // Set form values
  document.getElementById('driverId').value = driver.id;
  document.getElementById('publicName').value = driver.publicName || '';
  document.getElementById('driverName').value = driver.driverName || '';
  document.getElementById('phoneNumber').value = driver.phoneNumber || '';
  document.getElementById('emailAddress').value = driver.emailAddress || '';
  document.getElementById('residence').value = driver.residence || '';
  document.getElementById('vehicleNumber').value = driver.vehicleNumber || '';
  document.getElementById('vehicleType').value = driver.vehicleType || '';
  document.getElementById('driverID').value = driver.driverID || '';
  document.getElementById('idType').value = driver.idType || '';
  document.getElementById('idNumber').value = driver.idNumber || '';
  
  // Set images if they exist
  const previewImage = document.getElementById('previewImage');
  const frontIdPreview = document.getElementById('frontIdPreview');
  const backIdPreview = document.getElementById('backIdPreview');
  
  if (driver.profileImage) {
    previewImage.src = driver.profileImage;
    previewImage.style.display = 'block';
    document.querySelector('.image-upload p').style.display = 'none';
  }
  
  if (driver.frontIdImage) {
    frontIdPreview.src = driver.frontIdImage;
    frontIdPreview.style.display = 'block';
    document.querySelector('#frontIdUpload .upload-icon').style.display = 'none';
    document.querySelector('#frontIdUpload p').style.display = 'none';
  }
  
  if (driver.backIdImage) {
    backIdPreview.src = driver.backIdImage;
    backIdPreview.style.display = 'block';
    document.querySelector('#backIdUpload .upload-icon').style.display = 'none';
    document.querySelector('#backIdUpload p').style.display = 'none';
  }
  
  // Update button text and show cancel button
  const addButton = document.getElementById('addDriver');
  const cancelButton = document.getElementById('cancelEdit');
  addButton.textContent = 'Update Driver';
  addButton.style.background = 'var(--warning)';
  cancelButton.style.display = 'block';
  
  // Scroll to form
  document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Render drivers list
function renderDriversList() {
  const driversList = document.querySelector('.drivers-list');
  driversList.innerHTML = '<h2 class="list-title">List of Drivers</h2>';
  
  if (drivers.length === 0) {
    driversList.innerHTML += '<p class="no-drivers">No drivers added yet</p>';
    return;
  }
  
  drivers.forEach(driver => {
    const driverCard = document.createElement('div');
    driverCard.className = 'driver-card';
    driverCard.innerHTML = `
      <h3>${driver.driverName || 'Unnamed Driver'}</h3>
      <p>Vehicle: <span>${driver.vehicleNumber || 'N/A'}</span></p>
      <p>ID: <span>${driver.driverID || 'N/A'}</span></p>
      <p>Location: <span>${driver.residence || 'N/A'}</span></p>
      <div class="driver-actions">
        <button class="btn-edit" onclick="editDriver('${driver.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-delete" onclick="deleteDriver('${driver.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    driversList.appendChild(driverCard);
  });
}

// Cancel edit and reset form
document.getElementById('cancelEdit').addEventListener('click', resetForm);

// Load drivers from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedDrivers = localStorage.getItem('drivers');
  if (savedDrivers) {
    drivers = JSON.parse(savedDrivers);
    renderDriversList();
  }
  
  // Add hidden input for driver ID
  const form = document.querySelector('.form-container');
  if (!document.getElementById('driverId')) {
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.id = 'driverId';
    form.insertBefore(idInput, form.firstChild);
  }
});
// Image upload preview
document.getElementById('profileImage').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const previewImage = document.getElementById('previewImage');
      previewImage.src = event.target.result;
      previewImage.style.display = 'block';
      document.querySelector('.image-upload p').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

// Front ID image preview
document.getElementById('frontIdImage').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const previewImage = document.getElementById('frontIdPreview');
      previewImage.src = event.target.result;
      previewImage.style.display = 'block';
      document.querySelector('#frontIdUpload .upload-icon').style.display = 'none';
      document.querySelector('#frontIdUpload p').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

// Back ID image preview
document.getElementById('backIdImage').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const previewImage = document.getElementById('backIdPreview');
      previewImage.src = event.target.result;
      previewImage.style.display = 'block';
      document.querySelector('#backIdUpload .upload-icon').style.display = 'none';
      document.querySelector('#backIdUpload p').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

// Generate ID button functionality
document.getElementById('generateID').addEventListener('click', function() {
  const randomID = 'DRV-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('driverID').value = randomID;
  this.classList.add('animate__animated', 'animate__bounce');
  setTimeout(() => {
    this.classList.remove('animate__animated', 'animate__bounce');
  }, 1000);
});

// Add ID Type Dialog
const addIdTypeBtn = document.getElementById('addIdType');
const addIdTypeDialog = document.getElementById('addIdTypeDialog');
const cancelAddIdTypeBtn = document.getElementById('cancelAddIdType');
const saveIdTypeBtn = document.getElementById('saveIdType');

addIdTypeBtn.addEventListener('click', function() {
  addIdTypeDialog.style.display = 'flex';
});

cancelAddIdTypeBtn.addEventListener('click', function() {
  addIdTypeDialog.style.display = 'none';
});

saveIdTypeBtn.addEventListener('click', function() {
  const newIdTypeName = document.getElementById('newIdType').value.trim();
  if (newIdTypeName) {
    const idTypeSelect = document.getElementById('idType');
    const newOption = document.createElement('option');
    const idValue = newIdTypeName.toLowerCase().replace(/\s+/g, '_');
    
    newOption.value = idValue;
    newOption.textContent = newIdTypeName;
    idTypeSelect.appendChild(newOption);
    idTypeSelect.value = idValue;
    
    // Animation for select to indicate new item
    idTypeSelect.classList.add('animate__animated', 'animate__flash');
    setTimeout(() => {
      idTypeSelect.classList.remove('animate__animated', 'animate__flash');
    }, 1000);
    
    // Reset and close dialog
    document.getElementById('newIdType').value = '';
    addIdTypeDialog.style.display = 'none';
  }
});

// Form submission handler
document.getElementById('addDriver').addEventListener('click', function(e) {
  e.preventDefault();
  // Validation check - basic example
  let valid = true;
  const requiredFields = ['driverName', 'phoneNumber', 'residence', 'vehicleNumber', 'idType', 'idNumber'];
  
  requiredFields.forEach(field => {
    const input = document.getElementById(field);
    if (!input.value.trim()) {
      input.style.borderColor = 'rgba(255, 0, 0, 0.5)';
      valid = false;
      setTimeout(() => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }, 3000);
    }
  });
  
  // Check if ID images are uploaded
  const frontIdPreview = document.getElementById('frontIdPreview');
  const backIdPreview = document.getElementById('backIdPreview');
  
  if (!frontIdPreview.src || !backIdPreview.src) {
    const idUploads = document.querySelectorAll('.id-upload');
    idUploads.forEach(upload => {
      upload.style.borderColor = 'rgba(255, 0, 0, 0.5)';
      setTimeout(() => {
        upload.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }, 3000);
    });
    valid = false;
  }
  
  if (!valid) {
    // Shake button to indicate error
    this.classList.remove('animate__pulse', 'animate__infinite');
    this.classList.add('animate__animated', 'animate__shakeX');
    setTimeout(() => {
      this.classList.remove('animate__animated', 'animate__shakeX');
      this.classList.add('animate__pulse', 'animate__infinite');
    }, 1000);
    return;
  }
  
  // If validation passes, save the driver
  const driverData = getDriverData();
  saveDriver(driverData);
  
  // Reset the form after saving
  resetForm();
});
