const { MongoClient } = require("mongodb");
const fs = require("fs");
// Replace 'your_json_file.json' with the path to your JSON file

const readJSONFile = async () => {
  const filePath = "FTP_dir_arr.json";
  const data = await fs.promises.readFile(filePath, "utf8");

  try {
    // Parse the JSON data into JavaScript objects
    const jsonData = JSON.parse(data);

    return jsonData;
  } catch (error) {
    console.error(`Error parsing JSON: ${error.message}`);
  }
};

async function updateDocument() {
  try {
    const jsonData = await readJSONFile(); // Call the readJSONFile function
    const updatedDirs = jsonData.map((item) => ({
      code_name: item.code_name,
      host: item.host,
      dir: item.dir,
    }));
    console.log(updatedDirs);
    // MongoDB connection URL
    const url = "mongodb+srv://admin:pass@ewon.kmyoknu.mongodb.net/"; // Replace with your MongoDB server URL
    const dbName = "dams_WL";
    const collectionName = "dams";
    // Create a MongoDB client
    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    // Loop through jsonData and update documents based on code_name
    for (const item of jsonData) {
      const { code_name, dir, host } = item;
      await collection.updateOne({ code_name }, { $set: { dir, host } });
      console.log(`Updated document with code_name ${code_name}.`);
    }
    client.close();
  } catch (error) {
    console.error(`Error in anotherFunction: ${error.message}`);
  }
}

updateDocument()
