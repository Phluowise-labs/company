
function productManager() {
    return {
        // State
        products: [],
        searchTerm: '',
        showModal: false,
        showDeleteConfirmationModal: false,
        editingProductId: null,

        // Form fields
        productName: '',
        productPrice: '',
        productCurrency: 'GHS',
        productDiscount: '',
        productDescription: '',
        mediaType: 'none',
        mediaPreview: '',
        mediaData: '',
        dragOver: false,

        // Lifecycle
        init() {
            const saved = localStorage.getItem('products');
            this.products = saved ? JSON.parse(saved) : [];
        },

        // Computed
        get filteredProducts() {
            const term = this.searchTerm.toLowerCase();
            return this.products.filter(p => p.name.toLowerCase().includes(term));
        },

        // Modal handlers
        openModal(product = null) {
            if (product) {
                this.editingProductId = product.id;
                this.productName = product.name;
                this.productPrice = product.price;
                this.productCurrency = product.currency || 'GHS';
                this.productDiscount = product.discount || '';
                this.productDescription = product.description || '';
                this.mediaType = product.mediaType || 'none';
                this.mediaData = product.mediaData || '';
                this.mediaPreview = product.mediaData || '';
            } else {
                this.resetForm();
            }
            this.showModal = true;
        },

        closeModal() {
            this.resetForm();
            this.showModal = false;
        },

        // Save product (add or edit)
        saveProduct() {
            const product = {
                id: this.editingProductId || Date.now(),
                name: this.productName,
                price: this.productPrice,
                currency: this.productCurrency,
                discount: this.productDiscount,
                description: this.productDescription,
                mediaType: this.mediaType,
                mediaData: this.mediaPreview,
            };

            if (this.editingProductId) {
                const index = this.products.findIndex(p => p.id === this.editingProductId);
                if (index !== -1) this.products.splice(index, 1, product);
            } else {
                this.products.push(product);
            }

            this.saveToLocalStorage();
            // Delay modal close slightly to avoid interference with reactivity
            setTimeout(() => {
                this.closeModal();
            }, 100);
        },

        // Edit
        editProduct(product) {
            this.openModal(product);
        },

        // Delete logic
        deleteProductId: null,
        deleteProduct(id) {
            this.deleteProductId = id;
            this.showDeleteConfirmationModal = true;
        },

        confirmDelete() {
            this.products = this.products.filter(p => p.id !== this.deleteProductId);
            this.deleteProductId = null;
            this.showDeleteConfirmationModal = false;
            this.saveToLocalStorage();
        },

        cancelDelete() {
            this.deleteProductId = null;
            this.showDeleteConfirmationModal = false;
        },

        // Helpers
        resetForm() {
            this.editingProductId = null;
            this.productName = '';
            this.productPrice = '';
            this.productCurrency = 'GHS';
            this.productDiscount = '';
            this.productDescription = '';
            this.mediaType = 'none';
            this.mediaPreview = '';
            this.mediaData = '';
            this.dragOver = false;
        },

        resetMedia() {
            this.mediaPreview = '';
            this.mediaData = '';
            this.mediaType = 'none';
        },

        saveToLocalStorage() {
            localStorage.setItem('products', JSON.stringify(this.products));
        },

        // File Upload
        handleFileDrop(event) {
            const file = event.dataTransfer.files[0];
            this.dragOver = false;

            if (!file || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
                alert('Please upload a valid image or video file.');
                return;
            }

            this.processMedia(file);
        },

        handleFileSelect(event) {
            const file = event.target.files[0];

            if (!file || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
                alert('Please upload a valid image or video file.');
                return;
            }

            this.processMedia(file);
        },

        processMedia(file) {
            const reader = new FileReader();

            reader.onload = () => {
                this.mediaPreview = reader.result;
                this.mediaData = reader.result;

                if (file.type.startsWith('image/')) {
                    this.mediaType = 'image';
                } else if (file.type.startsWith('video/')) {
                    this.mediaType = 'video';
                } else {
                    this.mediaType = 'none';
                }
            };

            reader.readAsDataURL(file);
        }

    };
}
