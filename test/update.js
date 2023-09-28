const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb"); // Import ObjectId correctly
const fs = require("fs");

async function updatadata() {
  try {
    // Read the JSON file
    const data = JSON.parse(fs.readFileSync("./dams_WL.dams.json", "utf8"));

    console.log(data);
    const url = "mongodb+srv://admin:pass@ewon.kmyoknu.mongodb.net/";
    const dbName = "dams_WL";
    const collectionName = "dams";

    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect(); // Connect to MongoDB

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    for (const item of data) {
      const filter = { _id: new ObjectId(item._id.$oid) }; // Create ObjectId instance
      const updateDoc = { $set: { ...item, _id: filter._id } }; // Use $set to update fields or replace the entire document

      const result = await collection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 1) {
        console.log(`Updated document with code_name: ${item.code_name}`);
      } else if (result.matchedCount === 0) {
        console.log(`Document with code_name: ${item.code_name} not found`);
      } else {
        console.log(
          `No changes made to document with code_name: ${item.code_name}`
        );
      }
    }

    client.close(); // Close the MongoDB connection
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Call the function to update data
updatadata();
