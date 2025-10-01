// Payment Integration Module for Subscription System
import { databases, DB_ID } from './js/config.js';

class PaymentProcessor {
    constructor() {
        this.paymentMethods = {
            'stripe': this.processStripePayment.bind(this),
            'paypal': this.processPayPalPayment.bind(this),
            'momo': this.processMoMoPayment.bind(this),
            'bank_transfer': this.processBankTransferPayment.bind(this)
        };
    }

    /**
     * Process payment for subscription
     * @param {Object} paymentData - Payment information
     * @param {string} paymentData.subscriptionId - Subscription ID
     * @param {string} paymentData.companyId - Company ID
     * @param {number} paymentData.amount - Payment amount
     * @param {string} paymentData.method - Payment method
     * @param {Object} paymentData.details - Payment method specific details
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(paymentData) {
        try {
            console.log('Processing payment:', paymentData);

            // Validate payment data
            this.validatePaymentData(paymentData);

            // Get payment processor
            const processor = this.paymentMethods[paymentData.method];
            if (!processor) {
                throw new Error(`Unsupported payment method: ${paymentData.method}`);
            }

            // Process payment
            const paymentResult = await processor(paymentData);

            if (paymentResult.success) {
                // Update subscription after successful payment
                await this.updateSubscriptionAfterPayment(paymentData);
                
                // Record payment transaction
                await this.recordPaymentTransaction(paymentData, paymentResult);
            }

            return paymentResult;

        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message,
                transactionId: null
            };
        }
    }

    validatePaymentData(paymentData) {
        const required = ['subscriptionId', 'companyId', 'amount', 'method'];
        for (const field of required) {
            if (!paymentData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (paymentData.amount <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }
    }

    async updateSubscriptionAfterPayment(paymentData) {
        try {
            // Get current subscription
            const subscription = await this.getSubscription(paymentData.subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const now = new Date();
            const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

            const updates = {
                status: 'active',
                is_blocked: false,
                blocked_at: null,
                last_payment_date: now.toISOString(),
                end_date: nextMonth.toISOString(),
                payment_due_date: null,
                grace_period_end: null,
                amount_due: null,
                updated_at: now.toISOString()
            };

            // If upgrading from trial, change plan type
            if (subscription.plan_type === 'free_trial') {
                updates.plan_type = 'basic';
            }

            await databases.updateDocument(
                DB_ID,
                'subscriptions',
                subscription.$id,
                updates
            );

            console.log('Subscription updated after payment:', updates);

        } catch (error) {
            console.error('Error updating subscription after payment:', error);
            throw error;
        }
    }

    async getSubscription(subscriptionId) {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                'subscriptions',
                [databases.Query.equal('subscription_id', subscriptionId)]
            );

            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (error) {
            console.error('Error getting subscription:', error);
            throw error;
        }
    }

    async recordPaymentTransaction(paymentData, paymentResult) {
        try {
            const transactionData = {
                transaction_id: this.generateTransactionId(),
                subscription_id: paymentData.subscriptionId,
                company_id: paymentData.companyId,
                amount: paymentData.amount,
                payment_method: paymentData.method,
                status: paymentResult.success ? 'completed' : 'failed',
                external_transaction_id: paymentResult.transactionId,
                payment_date: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            // Note: This would require a 'payment_transactions' collection
            // For now, we'll just log it
            console.log('Payment transaction recorded:', transactionData);

            // In a real implementation, you would save this to a transactions collection
            // await databases.createDocument(DB_ID, 'payment_transactions', transactionData.transaction_id, transactionData);

        } catch (error) {
            console.error('Error recording payment transaction:', error);
        }
    }

    // Payment method implementations

    async processStripePayment(paymentData) {
        // Simulate Stripe payment processing
        console.log('Processing Stripe payment...');
        
        // In a real implementation, you would:
        // 1. Create a Stripe payment intent
        // 2. Confirm the payment
        // 3. Handle webhooks for payment status updates

        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.1; // 90% success rate for demo
                resolve({
                    success: success,
                    transactionId: success ? 'stripe_' + this.generateTransactionId() : null,
                    message: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds'
                });
            }, 2000);
        });
    }

    async processPayPalPayment(paymentData) {
        // Simulate PayPal payment processing
        console.log('Processing PayPal payment...');
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.15; // 85% success rate for demo
                resolve({
                    success: success,
                    transactionId: success ? 'paypal_' + this.generateTransactionId() : null,
                    message: success ? 'PayPal payment completed' : 'PayPal payment declined'
                });
            }, 3000);
        });
    }

    async processMoMoPayment(paymentData) {
        // Simulate Mobile Money payment processing (for Ghana/Africa)
        console.log('Processing Mobile Money payment...');
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.2; // 80% success rate for demo
                resolve({
                    success: success,
                    transactionId: success ? 'momo_' + this.generateTransactionId() : null,
                    message: success ? 'Mobile Money payment successful' : 'Mobile Money payment failed - please check your balance'
                });
            }, 4000);
        });
    }

    async processBankTransferPayment(paymentData) {
        // Simulate bank transfer processing
        console.log('Processing bank transfer payment...');
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.05; // 95% success rate for demo
                resolve({
                    success: success,
                    transactionId: success ? 'bank_' + this.generateTransactionId() : null,
                    message: success ? 'Bank transfer completed' : 'Bank transfer failed - invalid account details'
                });
            }, 5000);
        });
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Utility methods for UI integration

    async showPaymentModal(subscriptionData) {
        const amount = subscriptionData.amount_due || this.getPlanPrice(subscriptionData.plan_type);
        
        const { value: paymentMethod } = await Swal.fire({
            title: 'Choose Payment Method',
            html: `
                <div class="text-left space-y-4">
                    <div class="bg-gray-800 rounded-lg p-4 mb-4">
                        <div class="text-lg font-semibold text-white">Amount Due</div>
                        <div class="text-2xl font-bold text-blue-400">$${amount}</div>
                    </div>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer">
                            <input type="radio" name="payment" value="stripe" class="text-blue-600">
                            <div class="flex items-center space-x-2">
                                <i class="fab fa-stripe text-blue-500"></i>
                                <span class="text-white">Credit/Debit Card (Stripe)</span>
                            </div>
                        </label>
                        <label class="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer">
                            <input type="radio" name="payment" value="paypal" class="text-blue-600">
                            <div class="flex items-center space-x-2">
                                <i class="fab fa-paypal text-blue-400"></i>
                                <span class="text-white">PayPal</span>
                            </div>
                        </label>
                        <label class="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer">
                            <input type="radio" name="payment" value="momo" class="text-blue-600">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-mobile-alt text-green-500"></i>
                                <span class="text-white">Mobile Money</span>
                            </div>
                        </label>
                        <label class="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer">
                            <input type="radio" name="payment" value="bank_transfer" class="text-blue-600">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-university text-gray-400"></i>
                                <span class="text-white">Bank Transfer</span>
                            </div>
                        </label>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continue',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            background: '#1F2937',
            color: '#F9FAFB',
            preConfirm: () => {
                const selected = document.querySelector('input[name="payment"]:checked');
                if (!selected) {
                    Swal.showValidationMessage('Please select a payment method');
                    return false;
                }
                return selected.value;
            }
        });

        if (paymentMethod) {
            await this.processPaymentFlow(subscriptionData, paymentMethod, amount);
        }
    }

    async processPaymentFlow(subscriptionData, paymentMethod, amount) {
        try {
            // Show processing modal
            Swal.fire({
                title: 'Processing Payment',
                html: `
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p class="text-gray-300">Processing your ${paymentMethod} payment...</p>
                        <p class="text-sm text-gray-500 mt-2">Please do not close this window</p>
                    </div>
                `,
                allowOutsideClick: false,
                showConfirmButton: false,
                background: '#1F2937',
                color: '#F9FAFB'
            });

            // Process payment
            const paymentData = {
                subscriptionId: subscriptionData.subscription_id,
                companyId: subscriptionData.company_id,
                amount: amount,
                method: paymentMethod,
                details: {} // Additional payment method specific details
            };

            const result = await this.processPayment(paymentData);

            // Show result
            if (result.success) {
                await Swal.fire({
                    title: 'Payment Successful!',
                    text: 'Your subscription has been activated. Welcome back!',
                    icon: 'success',
                    confirmButtonColor: '#10B981',
                    background: '#1F2937',
                    color: '#F9FAFB'
                });

                // Reload page to reflect changes
                window.location.reload();
            } else {
                await Swal.fire({
                    title: 'Payment Failed',
                    text: result.error || 'There was an error processing your payment. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#EF4444',
                    background: '#1F2937',
                    color: '#F9FAFB'
                });
            }

        } catch (error) {
            console.error('Payment flow error:', error);
            await Swal.fire({
                title: 'Payment Error',
                text: 'An unexpected error occurred. Please try again later.',
                icon: 'error',
                confirmButtonColor: '#EF4444',
                background: '#1F2937',
                color: '#F9FAFB'
            });
        }
    }

    getPlanPrice(planType) {
        const prices = {
            'free_trial': 29.99,
            'basic': 29.99,
            'premium': 59.99,
            'enterprise': 99.99
        };
        return prices[planType] || 29.99;
    }
}

// Export the payment processor
export default PaymentProcessor;

// Make available globally for testing
window.PaymentProcessor = PaymentProcessor;