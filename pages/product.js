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
        description: '',
        price: '',
        discount: '',
        companyId: '6aaf9be8-5fc9-4c9b-9ea0-b9bf554181f7',
        productImage: null,
        quantityType: '',
        productSize: '',
        customSize: '',

        // API configuration
        apiUrl: '',
        apiPostUrl: 'https://phluowise.azurewebsites.net/product/new-product',
        apiUpdateUrl: 'https://phluowise.azurewebsites.net/product/update-product',

        // Init fetch
        async init() {
            console.log('🔄 Initializing product manager...');
            this.apiUrl = `https://phluowise.azurewebsites.net/product/all-products-by-company/${this.companyId}`;
            try {
                const response = await fetch(this.apiUrl);
                const text = await response.text();
                const data = JSON.parse(text);
                if (!response.ok) throw new Error(data.message || `HTTP Error: ${response.status}`);
                if (!Array.isArray(data)) throw new Error('Expected an array from API.');
                this.products = data;
                console.log('✅ Products loaded:', this.products);
            } catch (error) {
                console.error('🚨 Load error:', error);
                Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Something went wrong while loading products.' });
                this.products = [];
            }
            this.loaded = true;
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

            if (!this.quantityType) {
                Swal.fire({ icon: 'warning', title: 'Missing Quantity Type', text: 'Please select a quantity type.' });
                return;
            }

            if (!this.productSize) {
                Swal.fire({ icon: 'warning', title: 'Missing Product Size', text: 'Please select a product size.' });
                return;
            }

            if (this.productSize === 'custom' && !this.customSize.trim()) {
                Swal.fire({ icon: 'warning', title: 'Missing Custom Size', text: 'Please enter the custom size.' });
                return;
            }

            const finalSize = this.productSize === 'custom' ? this.customSize.trim() : this.productSize;

            // Prepare form data
            const formData = new FormData();
            if (this.editingProductId) {
                formData.append('Id', this.editingProductId);
            }

            formData.append('Description', this.description || '');
            formData.append('Price', this.price || '');
            formData.append('Discount', this.discount || '');
            formData.append('CompanyId', this.companyId || '');
            formData.append('QuantityType', this.quantityType || '');
            formData.append('ProductSize', finalSize);

            if (this.productImage) {
                formData.append('Image', this.productImage);
            }

            const isEdit = !!this.editingProductId;
            const url = isEdit ? this.apiUpdateUrl : this.apiPostUrl;
            const method = isEdit ? 'PUT' : 'POST';

            this.loading = true;
            Swal.fire({
                title: isEdit ? 'Updating product...' : 'Saving product...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                const response = await fetch(url, { method, body: formData });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Status ${response.status}`);
                }

                const result = await response.json();
                console.log('✅ Saved:', result);

                if (isEdit) {
                    const index = this.products.findIndex(p => p.id === this.editingProductId);
                    if (index !== -1) this.products.splice(index, 1, result);
                } else {
                    this.products.unshift(result);
                }

                this.closeModal();

                Swal.fire({
                    icon: 'success',
                    title: isEdit ? 'Product updated!' : 'Product added!',
                    timer: 2000,
                    showConfirmButton: false,
                });

            } catch (err) {
                console.error('❌ Save error:', err);
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to save product.' });
            } finally {
                this.loading = false;
                Swal.close();
            }
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
            this.description = '';
            this.price = '';
            this.discount = '';
            this.productImage = null;
            this.quantityType = '';
            this.productSize = '';
            this.customSize = '';
        },

        // Filter for search
        get filteredProducts() {
            if (!this.searchTerm) return this.products;
            const term = this.searchTerm.toLowerCase();
            return this.products.filter(p =>
                p.description && p.description.toLowerCase().includes(term)
            );
        },

        // Populate edit form
        editProduct(product) {
            this.editingProductId = product.id;
            this.description = product.description || '';
            this.price = product.price || '';
            this.discount = product.discount || '';
            this.quantityType = product.quantityType || ''; // <-- ADD THIS
            this.productSize = product.productSize || '';   // <-- ADD THIS
            this.customSize = product.customSize || '';     // <-- If you support custom input
            this.productImage = null; // We don't prefill file inputs
            this.showModal = true;
        }
        
        
    };
}
