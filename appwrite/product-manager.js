// This creates a global productManager function that Alpine.js can access

// Appwrite configuration
const APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = "68b17582003582da69c8";
const DB_ID = "68b1b7590035346a3be9";
const PRODUCTS_COLL = "product";
const BUCKET_ID = "68b1c57b001542be7fbe"; // Company assets bucket

// Initialize Appwrite client (using CDN version for non-module)
const client = new Appwrite.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT);

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);

function productManager() {
  return {
    // State
    products: [],
    searchTerm: "",
    showModal: false,
    showDeleteConfirmationModal: false,
    isEditing: false, // Unified edit mode
    currentProductId: null, // Unified product ID for editing
    loading: false,
    loaded: false,
    currentProductImageUrl: null,

    // Form fields
    productName: "",
    price: "",
    discount: "",
    companyId: "",
    branchId: "",
    productImage: null,
    quantity: "",
    size: "",
    customSize: "",
    productType: "",
    currency: "GHS",
    deliveryCharge: false,

    // Computed properties
    get filteredProducts() {
      if (!this.searchTerm) return this.products;
      const term = this.searchTerm.toLowerCase();
      return this.products.filter(
        (p) => p.product_name && p.product_name.toLowerCase().includes(term)
      );
    },

    // Upload product image to Appwrite Storage
    async uploadProductImage(file, companyId) {
      try {
        // console.log("=== UPLOAD DEBUG ===");
        // console.log("Original file type:", file.constructor.name);
        // console.log("Original file size:", file.size);
        
        // Compress image if it's too large (> 1MB)
        let processedFile = file;
        if (file.size > 1024 * 1024) {
          // console.log("Compressing image...");
          processedFile = await this.compressImage(file, 0.8); // Compress to 80% quality
          // console.log("Compressed file type:", processedFile.constructor.name);
          // console.log("Compressed file size:", processedFile.size);
        }
        
        // Verify we have a proper File object
        if (!(processedFile instanceof File)) {
          console.error("ERROR: processedFile is not a File object:", processedFile);
          throw new Error("Processed file is not a File object");
        }
        
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        
        // Generate a valid fileId that meets Appwrite requirements
        const shortCompanyId = companyId.substring(0, 8);
        const shortTimestamp = timestamp.toString().slice(-8);
        const fileName = `product_${shortCompanyId}_${shortTimestamp}.${fileExtension}`;
        
        // Ensure fileName is within 36 character limit
        const finalFileName = fileName.length > 36 ? 
          `product_${shortTimestamp}.${fileExtension}`.substring(0, 36) : 
          fileName;
        
        const result = await storage.createFile(
          BUCKET_ID,
          finalFileName,
          processedFile
        );
        
        // Get file URL
        const fileUrl = storage.getFileView(BUCKET_ID, result.$id);
        return fileUrl;
      } catch (error) {
        console.error("Error uploading product image:", error);
        throw error;
      }
    },

    // Compress image to reduce file size and upload time
    async compressImage(file, quality = 0.8) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions (max 800px width/height)
          const maxSize = 800;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            // Convert blob to File object with original filename
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
      });
    },

    get editProduct() {
      return this.isEditing;
    },

    // Modal controls
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.resetForm();
      // Clear product ID from URL when closing the modal
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("productId")) {
        urlParams.delete("productId");
        const newUrl =
          window.location.pathname +
          (urlParams.toString() ? "?" + urlParams.toString() : "");
        window.history.replaceState({}, "", newUrl);
      }
    },
    resetForm() {
      this.productName = "";
      this.price = "";
      this.discount = "";
      this.productImage = null;
      this.quantity = "";
      this.size = "";
      this.customSize = "";
      this.productType = "";
      this.currency = "GHS";
      this.deliveryCharge = false;
      this.isEditing = false;
      this.currentProductId = null;
      this.currentProductImageUrl = null;
      this.loaded = false;
    },

    // Fetch products (merged logic)
    async fetchProducts() {
      try {
        this.loading = true;
        // console.log('🔍 Starting fetchProducts...');
        
        // Get company and branch context
        // console.log('📋 Getting user account...');
        const user = await account.get();
        // console.log('👤 User:', user);
        
        const activeRole = localStorage.getItem("activeRole");
        // console.log('🎭 Active role:', activeRole);
        
        let companyId, branchId;
        if (activeRole === "admin") {
          // console.log('🏢 Fetching company data for admin...');
          const companyDocs = await databases.listDocuments(
            DB_ID,
            "company_tb",
            [Appwrite.Query.equal("company_id", user.$id)]
          );
          // console.log('🏢 Company docs:', companyDocs);
          
          if (companyDocs.documents.length > 0) {
            companyId = companyDocs.documents[0].company_id;
            branchId = companyId;
            // console.log('✅ Admin context - companyId:', companyId, 'branchId:', branchId);
          } else {
            throw new Error("Company record not found for admin user");
          }
        } else {
          // console.log('🏪 Fetching branch data for branch user...');
          const branchDocs = await databases.listDocuments(DB_ID, "branches", [
            Appwrite.Query.equal("email", user.email),
          ]);
          // console.log('🏪 Branch docs:', branchDocs);
          
          if (branchDocs.documents.length > 0) {
            const branch = branchDocs.documents[0];
            branchId = branch.branch_id;
            companyId = branch.company_id;
            // console.log('✅ Branch context - companyId:', companyId, 'branchId:', branchId);
          } else {
            throw new Error("Branch record not found for user");
          }
        }
        
        // Fetch products by branch_id (products belong to specific branches)
        // console.log('📦 Fetching products with filters:', { companyId, branchId });
        const response = await databases.listDocuments(DB_ID, PRODUCTS_COLL, [
          Appwrite.Query.equal("branch_id", branchId),
        ]);
        // console.log('📦 Products response:', response);
        
        this.products = response.documents.map((product) => ({
          ...product,
          product_image_url: product.product_image
            ? storage.getFileView(BUCKET_ID, product.product_image)
            : null,
        }));
        // console.log('✅ Products processed:', this.products);
        
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        this.products = [];
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Error Loading Products",
            text: `Failed to load products from database: ${error.message}. Please refresh the page.`,
          });
        }
      } finally {
        this.loading = false;
      }
    },

    // Save product (create or update, merged logic)
    async saveProduct() {
      if (this.loading) return;
      // Validation (from product.js)
      if (!this.price || isNaN(this.price) || parseFloat(this.price) <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Price",
          text: "Enter a valid price greater than 0.",
        });
        return;
      }
      if (
        this.discount &&
        (isNaN(this.discount) || this.discount < 0 || this.discount > 100)
      ) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Discount",
          text: "Enter a discount between 0 and 100.",
        });
        return;
      }
      if (!this.productName.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Missing Product Name",
          text: "Please enter a product name.",
        });
        return;
      }
      if (!this.quantity || isNaN(this.quantity) || parseInt(this.quantity) <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Quantity",
          text: "Enter a valid quantity greater than 0.",
        });
        return;
      }
      if (!this.size) {
        Swal.fire({
          icon: "warning",
          title: "Missing Size",
          text: "Please select a size.",
        });
        return;
      }
      if (this.size === "custom" && !this.customSize.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Missing Custom Size",
          text: "Please enter the custom size.",
        });
        return;
      }
      if (!this.productType) {
        Swal.fire({
          icon: "warning",
          title: "Missing Product Type",
          text: "Please select a product type.",
        });
        return;
      }
      // Prepare product data
      // Ensure companyId and branchId are set before saving
      if (!this.companyId || !this.branchId) {
        // Try to set from user context if missing
        const user = await account.get();
        const activeRole = localStorage.getItem("activeRole");
        if (activeRole === "admin") {
          const companyDocs = await databases.listDocuments(
            DB_ID,
            "company_tb",
            [Appwrite.Query.equal("company_id", user.$id)]
          );
          if (companyDocs.documents.length > 0) {
            this.companyId = companyDocs.documents[0].company_id;
            this.branchId = this.companyId;
          }
        } else {
          const branchDocs = await databases.listDocuments(DB_ID, "branches", [
            Appwrite.Query.equal("email", user.email),
          ]);
          if (branchDocs.documents.length > 0) {
            const branch = branchDocs.documents[0];
            this.branchId = branch.branch_id;
            this.companyId = branch.company_id;
          }
        }
      }
      const finalSize =
        this.size === "custom" ? this.customSize.trim() : this.size;
      // console.log("Creating product with finalSize:", finalSize);
      
      const isEdit = !!this.currentProductId;
      
      // Show loading modal immediately
      this.loading = true;
      Swal.fire({
        title: isEdit ? "Updating product..." : "Saving product...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      
      // Handle image upload ONCE - regardless of edit or create
      let imageUrl = null;
      if (this.productImage) {
        try {
          // console.log("=== UPLOADING IMAGE ===");
          imageUrl = await this.uploadProductImage(this.productImage, this.companyId);
          // console.log("Image uploaded successfully:", imageUrl);
        } catch (error) {
          console.error("Image upload failed:", error);
          Swal.fire({
            icon: "warning",
            title: "Image Upload Failed",
            text: "Product will be saved without image.",
          });
        }
      } else if (isEdit && this.currentProductImageUrl) {
        // If editing and no new image selected, preserve existing image
        imageUrl = this.currentProductImageUrl;
        // console.log("Preserving existing image:", imageUrl);
      }
      
      // Prepare product data
      const productData = {
        product_name: this.productName,
        price: this.price.toString(),
        discount: this.discount.toString(),
        company_id: this.companyId,
        branch_id: this.branchId,
        currency: this.currency,
        delivery_charge: this.deliveryCharge === 'true' || this.deliveryCharge === true,
        product_type: this.productType,
        quantity: this.quantity.toString(),
        size: finalSize,
        product_image: imageUrl || "",
      };
      
      try {
        let result;
        if (isEdit) {
          // Update existing product
          result = await databases.updateDocument(
            DB_ID,
            PRODUCTS_COLL,
            this.currentProductId,
            productData
          );
          const index = this.products.findIndex(
            (p) => p.$id === this.currentProductId
          );
          if (index !== -1) {
            this.products[index] = result;
          }
        } else {
          // Create new product - single operation
          // console.log("=== CREATING NEW PRODUCT ===");
          // console.log("Product data:", JSON.stringify(productData, null, 2));

          // Create with temporary product_id, then update with real ID
          const tempData = {
            ...productData,
            product_id: "temp", // Temporary value for required field
          };

          result = await databases.createDocument(
            DB_ID,
            PRODUCTS_COLL,
            "unique()",
            tempData
          );

          // console.log("=== PRODUCT CREATED ===");
          // console.log("result.$id:", result.$id);

          // Update with the proper product_id
          const finalData = {
            ...productData,
            product_id: result.$id,
          };

          result = await databases.updateDocument(
            DB_ID,
            PRODUCTS_COLL,
            result.$id,
            finalData
          );

          // console.log("=== PRODUCT UPDATED WITH FINAL DATA ===");
          
          // Add to local array
          this.products.unshift(result);
        }
        
        this.closeModal();
        Swal.fire({
          icon: "success",
          title: isEdit ? "Product updated!" : "Product added!",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("❌ Product save error:", err);
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: err.message || "Something went wrong while saving the product.",
        });
      } finally {
        this.loading = false;
        Swal.close();
      }
    },

    // Delete product (merged logic)
    async deleteProduct(productId) {
      // console.log('🗑️ deleteProduct called with ID:', productId);
      // console.log('🗑️ Before - showDeleteConfirmationModal:', this.showDeleteConfirmationModal);
      this.currentProductId = productId;
      this.showDeleteConfirmationModal = true;
      // console.log('🗑️ After - showDeleteConfirmationModal:', this.showDeleteConfirmationModal);
      // console.log('🗑️ currentProductId set to:', this.currentProductId);
    },
    async confirmDelete() {
      // console.log('🔥 confirmDelete called - currentProductId:', this.currentProductId);
      if (!this.currentProductId) return;
      
      // Close the modal first
      this.showDeleteConfirmationModal = false;
      this.loading = true;
      
      Swal.fire({
        title: "Deleting product...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      try {
        await databases.deleteDocument(
          DB_ID,
          PRODUCTS_COLL,
          this.currentProductId
        );
        const index = this.products.findIndex(
          (p) => p.$id === this.currentProductId
        );
        if (index !== -1) {
          this.products.splice(index, 1);
        }
        this.currentProductId = null;
        Swal.fire({
          icon: "success",
          title: "🗑️ Deleted Successfully!",
          text: "The product has been permanently removed from your inventory.",
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: false,
          position: 'center',
          backdrop: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          customClass: {
            popup: 'animate__animated animate__fadeInDown animate__slow'
          },
          didOpen: () => {
            // Slow down the closing animation
            const popup = Swal.getPopup();
            popup.style.animationDuration = '0.8s';
          },
          willClose: () => {
            // Add custom slow fade-out animation
            const popup = Swal.getPopup();
            popup.style.animation = 'fadeOut 0.8s ease-out';
          }
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to delete product.",
        });
      } finally {
        this.loading = false;
        Swal.close();
      }
    },
    cancelDelete() {
      this.showDeleteConfirmationModal = false;
      this.currentProductId = null;
    },

    // Populate edit form
    editProduct(product) {
      this.currentProductId = product.$id;
      this.isEditing = true;
      this.productName = product.product_name || "";
      this.price = product.price || "";
      this.discount = product.discount || "";
      this.quantity = product.quantity || "";
      this.size = product.size || "";
      this.customSize = product.custom_size || "";
      this.productType = product.product_type || "";
      this.currency = product.currency || "GHS";
      this.deliveryCharge = product.delivery_charge || false;
      this.productImage = null;
      // Preserve existing image URL for display and fallback
      this.currentProductImageUrl = product.product_image || null;
      this.showModal = true;
    },
    // Initialization method for Alpine.js
    async init() {
      try {
        await this.fetchProducts();
        // Check if there's a product ID in the URL to load for editing
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get("productId");
        if (productId) {
          const product = this.products.find((p) => p.$id === productId);
          if (product) {
            this.editProduct(product);
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        // Always set loaded to true, even if fetchProducts fails
        this.loaded = true;
      }
    },
    // File select handler for Alpine.js
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Invalid File",
            text: "Accepted: JPEG, PNG, GIF.",
          });
        } else {
          alert("Invalid file type. Accepted: JPEG, PNG, GIF.");
        }
        return;
      }
      this.productImage = file;
      event.target.value = "";
    },
  };
}

window.productManager = productManager;

// console.log("✅ ProductManager function is now globally available");
