// Import Appwrite configuration
import { databases, Appwrite, DB_ID, PRODUCTS_COLL, account, BRANCH_COLL, COMPANY_COLL } from './js/config.js';

function productManager() {
    return {
        // State
        products: [],
        searchTerm: '',
        showModal: false,
        showDeleteConfirmationModal: false,
        editingProductId: null,
        loading: false,
        loaded: false,

        // Form fields
        productName: '',
        price: '',
        discount: '',
        companyId: '',
        branchId: '', // Will be set based on current user's branch
        productImage: null,
        quantity: '',
        size: '',
        customSize: '',
        productType: '',
        currency: 'GHS',
        deliveryCharge: false,
        // Init fetch
        async init() {
            console.log('🔄 Initializing product manager...');
            
            // Get branch_id from localStorage or determine from user role
            await this.setBranchId();
            
            try {
                // Fetch products from Appwrite database
                const response = await databases.listDocuments(DB_ID, PRODUCTS_COLL, [
                    Appwrite.Query.equal('company_id', this.companyId)
                ]);
                
                this.products = response.documents;
                console.log('✅ Products loaded:', this.products);
            } catch (error) {
                console.error('🚨 Load error:', error);
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Error', 
                    text: error.message || 'Something went wrong while loading products.' 
                });
                this.products = [];
            }
            this.loaded = true;
        },

        // Set branch_id and company_id based on current user's role
        async setBranchId() {
            try {
                const user = await account.get();
                const activeRole = localStorage.getItem('activeRole');
                
                if (activeRole === 'admin') {
                    // For admin, get company_id from user's company record
                    const companyDocs = await databases.listDocuments(DB_ID, COMPANY_COLL, [
                        Appwrite.Query.equal('company_id', user.$id)
                    ]);
                    
                    if (companyDocs.documents.length > 0) {
                        this.companyId = companyDocs.documents[0].company_id;
                        this.branchId = this.companyId; // Admin uses company_id as branch_id
                    } else {
                        throw new Error('Company record not found for admin user');
                    }
                } else {
                    // For branch user, get their branch_id and company_id
                    const branchDocs = await databases.listDocuments(DB_ID, BRANCH_COLL, [
                        Appwrite.Query.equal('email', user.email)
                    ]);
                    
                    if (branchDocs.documents.length > 0) {
                        const branch = branchDocs.documents[0];
                        this.branchId = branch.branch_id;
                        this.companyId = branch.company_id;
                    } else {
                        throw new Error('Branch record not found for user');
                    }
                }
                
                console.log('✅ Branch ID set:', this.branchId);
                console.log('✅ Company ID set:', this.companyId);
            } catch (error) {
                console.error('❌ Error setting branch/company ID:', error);
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Authentication Error', 
                    text: 'Unable to determine your company/branch. Please contact support.' 
                });
                // Redirect to signin if we can't determine the user's role
                window.location.href = 'signin.html';
            }
        },

        // Save product (new or update)
        async saveProduct() {
            if (this.loading) return;

            // Validation
            if (!this.price || isNaN(this.price) || parseFloat(this.price) <= 0) {
                Swal.fire({ icon: 'warning', title: 'Invalid Price', text: 'Enter a valid price greater than 0.' });
                return;
            }

            if (this.discount && (isNaN(this.discount) || this.discount < 0 || this.discount > 100)) {
                Swal.fire({ icon: 'warning', title: 'Invalid Discount', text: 'Discount must be between 0 and 100.' });
                return;
            }

            if (!this.quantity) {
                Swal.fire({ icon: 'warning', title: 'Missing Quantity', text: 'Please enter a quantity.' });
                return;
            }

            if (!this.size) {
                Swal.fire({ icon: 'warning', title: 'Missing Size', text: 'Please select a size.' });
                return;
            }

            if (this.size === 'custom' && !this.customSize.trim()) {
                Swal.fire({ icon: 'warning', title: 'Missing Custom Size', text: 'Please enter the custom size.' });
                return;
            }

            if (!this.productType) {
                Swal.fire({ icon: 'warning', title: 'Missing Product Type', text: 'Please select a product type.' });
                return;
            }

            const finalSize = this.size === 'custom' ? this.customSize.trim() : this.size;

            // Prepare product data
            const productData = {
                product_id: 'unique()', // Will be replaced by Appwrite
                product_name: this.productName || '',
                price: parseFloat(this.price),
                discount: this.discount ? parseFloat(this.discount) : 0,
                company_id: this.companyId,
                branch_id: this.branchId,
                quantity: this.quantity,
                size: finalSize,
                product_type: this.productType,
                currency: this.currency,
                delivery_charge: this.deliveryCharge
            };

            // Handle image upload if present
            let imageUrl = null;
            if (this.productImage) {
                try {
                    // Upload image to Appwrite Storage (you'll need to set up storage bucket)
                    // For now, we'll store as base64 or skip image handling
                    console.log('Image file selected:', this.productImage.name);
                    // TODO: Implement image upload to Appwrite Storage
                } catch (error) {
                    console.error('Image upload error:', error);
                    Swal.fire({ 
                        icon: 'warning', 
                        title: 'Image Upload Failed', 
                        text: 'Product will be saved without image.' 
                    });
                }
            }

            if (imageUrl) {
                productData.image_url = imageUrl;
            }

            const isEdit = !!this.editingProductId;
            
            this.loading = true;
            Swal.fire({
                title: isEdit ? 'Updating product...' : 'Saving product...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                let result;
                
                if (isEdit) {
                    // Update existing product
                    result = await databases.updateDocument(
                        DB_ID, 
                        PRODUCTS_COLL, 
                        this.editingProductId, 
                        productData
                    );
                    
                    // Update local array
                    const index = this.products.findIndex(p => p.$id === this.editingProductId);
                    if (index !== -1) {
                        this.products[index] = result;
                    }
                } else {
                    // Create new product
                    result = await databases.createDocument(
                        DB_ID, 
                        PRODUCTS_COLL, 
                        'unique()', // Auto-generate ID
                        productData
                    );
                    
                    // Add to local array
                    this.products.unshift(result);
                }

                console.log('✅ Saved:', result);

                this.closeModal();

                Swal.fire({
                    icon: 'success',
                    title: isEdit ? 'Product updated!' : 'Product added!',
                    timer: 2000,
                    showConfirmButton: false,
                });

            } catch (err) {
                console.error('❌ Save error:', err);
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Error', 
                    text: err.message || 'Failed to save product.' 
                });
            } finally {
                this.loading = false;
                Swal.close();
            }
        },

        // Delete product
        async deleteProduct(productId) {
            this.editingProductId = productId;
            this.showDeleteConfirmationModal = true;
        },

        // Confirm delete
        async confirmDelete() {
            if (!this.editingProductId) return;

            this.loading = true;
            Swal.fire({
                title: 'Deleting product...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                await databases.deleteDocument(DB_ID, PRODUCTS_COLL, this.editingProductId);
                
                // Remove from local array
                const index = this.products.findIndex(p => p.$id === this.editingProductId);
                if (index !== -1) {
                    this.products.splice(index, 1);
                }

                this.showDeleteConfirmationModal = false;
                this.editingProductId = null;

                Swal.fire({
                    icon: 'success',
                    title: 'Product deleted!',
                    timer: 2000,
                    showConfirmButton: false,
                });

            } catch (err) {
                console.error('❌ Delete error:', err);
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Error', 
                    text: err.message || 'Failed to delete product.' 
                });
            } finally {
                this.loading = false;
                Swal.close();
            }
        },

        // Cancel delete
        cancelDelete() {
            this.showDeleteConfirmationModal = false;
            this.editingProductId = null;
        },

        // File input handler
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Accepted: JPEG, PNG, GIF.' });
                return;
            }

            this.productImage = file;
            event.target.value = '';
        },

        // Modal controls
        openModal() {
            this.resetForm();
            this.showModal = true;
        },

        closeModal() {
            this.resetForm();
            this.showModal = false;
        },

        // Reset form
        resetForm() {
            this.editingProductId = null;
            this.productName = '';
            this.price = '';
            this.discount = '';
            this.productImage = null;
            this.quantity = '';
            this.size = '';
            this.customSize = '';
            this.productType = '';
            this.deliveryCharge = false;
        },

        // Filter for search
        get filteredProducts() {
            if (!this.searchTerm) return this.products;
            const term = this.searchTerm.toLowerCase();
            return this.products.filter(p =>
                p.product_name && p.product_name.toLowerCase().includes(term)
            );
        },

        // Populate edit form
        editProduct(product) {
            this.editingProductId = product.$id;
            this.productName = product.product_name || '';
            this.price = product.price || '';
            this.discount = product.discount || '';
            this.quantity = product.quantity || '';
            this.size = product.size || '';
            this.customSize = product.custom_size || '';
            this.productType = product.product_type || '';
            this.currency = product.currency || 'GHS';
            this.deliveryCharge = product.delivery_charge || false;
            this.productImage = null; // We don't prefill file inputs
            this.showModal = true;
        }
    };
}