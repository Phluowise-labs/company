// Driver Registration Form Script
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

// Add driver button animation
document.getElementById('addDriver').addEventListener('click', function() {
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
  
  // Success animation
  this.classList.remove('animate__pulse', 'animate__infinite');
  this.classList.add('animate__bounceIn');
  this.textContent = 'Driver Added!';
  this.style.background = 'var(--success)';
  
  // Create a new driver card for demo purposes
  const driversList = document.querySelector('.drivers-list');
  const newDriver = document.createElement('div');
  newDriver.className = 'driver-card animate__animated animate__fadeInUp';
  
  const driverName = document.getElementById('driverName').value || 'New Driver';
  const vehicleNumber = document.getElementById('vehicleNumber').value || 'Not Specified';
  const driverID = document.getElementById('driverID').value || 'Not Generated';
  const residence = document.getElementById('residence').value || 'Not Specified';
  
  newDriver.innerHTML = `
    <h3>${driverName}</h3>
    <p>Vehicle Number: <span>${vehicleNumber}</span></p>
    <p>Driver ID: <span>${driverID}</span></p>
    <p>Location: <span>${residence}</span></p>
  `;
  
  driversList.appendChild(newDriver);
  
  setTimeout(() => {
    this.classList.remove('animate__bounceIn');
    this.classList.add('animate__pulse', 'animate__infinite');
    this.textContent = 'Add Driver';
    this.style.background = 'var(--primary)';
  }, 3000);
});
