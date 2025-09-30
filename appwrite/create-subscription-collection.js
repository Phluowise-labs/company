// Create Subscription Collection in Appwrite
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('68b17582003582da69c8') // Your project ID
    .setKey('your-api-key-here'); // Your API key - replace with actual key

const databases = new Databases(client);

const DB_ID = '68b1b7590035346a3be9'; // Your database ID
const COLLECTION_ID = 'subscriptions';

async function createSubscriptionCollection() {
    try {
        console.log('Creating subscription collection...');
        
        // Create the collection
        const collection = await databases.createCollection(
            DB_ID,
            COLLECTION_ID,
            'Subscriptions',
            [
                databases.Permission.read('any'),
                databases.Permission.write('any'),
                databases.Permission.update('any'),
                databases.Permission.delete('any')
            ]
        );

        console.log('Collection created:', collection.name);
        
        // Create attributes
        const attributes = [
            { key: 'subscription_id', type: 'string', size: 50, required: true },
            { key: 'company_id', type: 'string', size: 50, required: true },
            { key: 'plan_type', type: 'string', size: 20, required: true },
            { key: 'status', type: 'string', size: 20, required: true },
            { key: 'start_date', type: 'datetime', required: true },
            { key: 'end_date', type: 'datetime', required: true },
            { key: 'trial_end_date', type: 'datetime', required: false },
            { key: 'payment_due_date', type: 'datetime', required: false },
            { key: 'amount_due', type: 'double', required: false },
            { key: 'last_payment_date', type: 'datetime', required: false },
            { key: 'is_blocked', type: 'boolean', required: true, default: false },
            { key: 'blocked_at', type: 'datetime', required: false },
            { key: 'grace_period_end', type: 'datetime', required: false },
            { key: 'created_at', type: 'datetime', required: true },
            { key: 'updated_at', type: 'datetime', required: true }
        ];
        
        for (const attr of attributes) {
            try {
                let attribute;
                
                switch (attr.type) {
                    case 'string':
                        attribute = await databases.createStringAttribute(
                            DB_ID,
                            COLLECTION_ID,
                            attr.key,
                            attr.size,
                            attr.required,
                            attr.default
                        );
                        break;
                    case 'datetime':
                        attribute = await databases.createDatetimeAttribute(
                            DB_ID,
                            COLLECTION_ID,
                            attr.key,
                            attr.required,
                            attr.default
                        );
                        break;
                    case 'boolean':
                        attribute = await databases.createBooleanAttribute(
                            DB_ID,
                            COLLECTION_ID,
                            attr.key,
                            attr.required,
                            attr.default
                        );
                        break;
                    case 'double':
                        attribute = await databases.createFloatAttribute(
                            DB_ID,
                            COLLECTION_ID,
                            attr.key,
                            attr.required,
                            null, // min
                            null, // max
                            attr.default
                        );
                        break;
                }
                
                console.log(`Created attribute: ${attr.key} (${attr.type})`);
                
                // Wait a bit between attribute creation
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error creating attribute ${attr.key}:`, error.message);
            }
        }
        
        // Create indexes
        console.log('Creating indexes...');
        
        try {
            await databases.createIndex(
                DB_ID,
                COLLECTION_ID,
                'company_id_index',
                'key',
                ['company_id']
            );
            console.log('Created company_id index');
        } catch (error) {
            console.error('Error creating company_id index:', error.message);
        }

        try {
            await databases.createIndex(
                DB_ID,
                COLLECTION_ID,
                'status_index',
                'key',
                ['status']
            );
            console.log('Created status index');
        } catch (error) {
            console.error('Error creating status index:', error.message);
        }

        console.log('Subscription collection setup complete!');
        
    } catch (error) {
        console.error('Error creating subscription collection:', error);
    }
}

// Run the script
createSubscriptionCollection();