// npm install node-appwrite
import fs from "fs";
import { Client, Databases } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1") // your Appwrite endpoint
  .setProject("68b17582003582da69c8")
  .setKey(
    "standard_70e5b593f1867d1c13406903d2d3ebca97fa1731a9fb5fd7db1968d1c01693d3591cc2cf1ef6ac2c64b170a3496f1d674084195022b20dd1662679a94b1d0c1d0159afb20793e68906b6412c8275212353c3db984749f33add14fa731734a73e48ebd6b7a8df462eab7798d1300ffbd8686596d04053eba77b3c95b58f4e6382"
  ); // <-- get this from Appwrite Console (API Keys)

const DB_ID = "68b1b7590035346a3be9"; // phluowisez_db
const databases = new Databases(client);

async function exportSchema() {
  const collectionsResp = await databases.listCollections(DB_ID);
  const schema = [];

  for (const col of collectionsResp.collections) {
    const attrsResp = await databases.listAttributes(DB_ID, col.$id);
    schema.push({
      collectionId: col.$id,
      collectionName: col.name,
      attributes: attrsResp.attributes,
    });
  }

  fs.writeFileSync("appwrite-schema.json", JSON.stringify(schema, null, 2));
  console.log("✅ Schema exported to appwrite-schema.json");
}

exportSchema().catch((err) => console.error("❌ Failed:", err.message));
