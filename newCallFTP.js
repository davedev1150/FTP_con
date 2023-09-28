const ftp = require("ftp");
const csv = require("csv-parser");
const { MongoClient } = require("mongodb");
const fs = require("fs").promises;
const bson = require("bson");
const coninfo = {
  host: "203.150.102.162",
  port: 21,
  user: "LCHNMA",
  be_under: "8",
  password: "]ec=t]ec=t",
  name: "ลำแชะ", // Add the server name here
  dir: ["/Omnia1", "/Omnia2"], // Specify the directories you want to process
};

async function processRemoteDirectory(coninfo, dirPath) {
  const client = new ftp();
  let resultsArray = [];
  let status_con = false;
  try {
    await new Promise((resolve, reject) => {
      client.on("ready", () => {
        console.log(`Connected to ${coninfo.name}`);
        status_con = true;
        // Change the remote directory
        client.cwd(dirPath, (err, newCurrentDir) => {
          if (err) {
            console.error(
              `Error changing remote directory at ${coninfo.name} to ${dirPath}:`,
              err
            );
            reject(err);
          } else {
            console.log(`Remote directory changed to: ${dirPath}`);

            // List files in the current directory
            client.list(dirPath, (err, list) => {
              if (err) {
                console.error(`Error listing directory at ${dirPath}:`, err);
                reject(err);
              } else {
                console.log(
                  `Remote directory listing at ${dirPath} ${coninfo.name}:`
                );
                sortedList = list.sort((a, b) => b.date - a.date);
                const fileToDownload = sortedList[0];
                //console.log(fileToDownload);
                if (fileToDownload && fileToDownload.type === "-") {
                  client.get(fileToDownload.name, (err, stream) => {
                    if (err) {
                      console.error(
                        `Error downloading file ${fileToDownload.name} from ${coninfo.name}:`,
                        err
                      );
                      reject(err);
                    } else {
                      let results = [];
                      // Read the file contents
                      stream.pipe(csv({ headers: true })).on("data", (data) => {
                        results.push(data);
                        // Here, 'data' represents each row in the CSV
                      });

                      stream.on("end", () => {
                        if (results.length > 1) {
                          const data = results.map((obj) => Object.values(obj));
                          const filteredHeaders = data[0].filter(
                            (_, index) => data[1][index] == "  NAN"
                          );
                          console.log(filteredHeaders);
                          resultsArray.push({
                            name: coninfo.name,
                            code_name: coninfo.code_name,
                            be_under: coninfo.be_under,
                            use_dir: dirPath,
                            isdata: true,
                            header: filteredHeaders,
                            file: fileToDownload.name,
                            status_con: status_con,
                          });
                        } else {
                          console.log("Nodata");
                          resultsArray.push({
                            name: coninfo.name,
                            code_name: coninfo.code_name,
                            be_under: coninfo.be_under,
                            use_dir: dirPath,
                            isdata: false,
                            header: filteredHeaders,
                            file: fileToDownload.name,
                            status_con: status_con,
                          });
                        }
                        // Resolve the promise here, after CSV parsing is complete
                        resolve(resultsArray);
                      });
                    }
                  });
                } else {
                  console.log("No files to download.");
                  // Resolve with null if there are no files to download
                  reject("No files to download.");
                }
              }
            });
          }
        });
      });

      client.on("error", (err) => {
        console.error("FTP error:", err);
        reject(err);
      });

      client.connect({
        host: coninfo.host,
        port: 21,
        user: coninfo.user,
        password: coninfo.password,
        passive: true,
        connTimeout: 300000,
        pasvTimeout: 300000,
        keepalive: 300000,
      });
    });
    return resultsArray; // Return the resultsArray here
    // ... (the rest of your code remains the same)
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
}

async function findDocuments() {
  try {
    const url = "mongodb+srv://admin:pass@ewon.kmyoknu.mongodb.net/";
    const dbName = "dams_WL";
    const collectionName = "FTP";

    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect(); // Connect to MongoDB

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cursor = collection.find({});
    const documentsArray = await cursor.toArray();
    console.log(documentsArray);

    client.close(); // Close the MongoDB connection
    return documentsArray;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function findDocumentsByCodeName(codename) {
  try {
    const url = "mongodb+srv://admin:pass@ewon.kmyoknu.mongodb.net/";
    const dbName = "dams_WL";
    const collectionName = "FTP";

    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect(); // Connect to MongoDB

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const filter = { code_name: codename };

    const cursor = collection.find(filter);
    const documentsArray = await cursor.toArray();
    console.log(documentsArray);

    client.close(); // Close the MongoDB connection
    return documentsArray;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function CallFTP() {
  try {
    const damsinfo = await findDocuments();
    const results = [];
    // console.log(damsinfo);

    // Use Promise.allSettled to process directories concurrently
    const promises = damsinfo.map(async (coninfo) => {
      const dirPromises = coninfo.dir.map(async (dirPath) => {
        const result = await processRemoteDirectory(coninfo, dirPath);
        if (result !== null) {
          results.push(result);
        }
      });
      await Promise.allSettled(dirPromises);
    });

    await Promise.allSettled(promises);
    console.log("Resolved results:", results);
    const FTP_data_obj = damsinfo.map((obj1) => {
      obj1.FTPdata = []; // Initialize FTPdata as an empty array for each object in damsinfo
      results.forEach((obj2) => {
        if (obj1.code_name === obj2[0].code_name) {
          obj1.FTPdata.push({
            use_dir: obj2[0].use_dir,
            isdata: obj2[0].isdata,
            header: obj2[0].header,
            file: obj2[0].file,
            status_con: obj2[0].status_con,
          });
        }
      });

      return obj1; // Return the modified object with FTPdata
    });

    console.log(FTP_data_obj);
    return FTP_data_obj;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function CallFTPbyCodeName(codename) {
  try {
    const damsinfo = await findDocumentsByCodeName(codename);
    const results = [];
    // console.log(damsinfo);

    // Use Promise.allSettled to process directories concurrently
    const promises = damsinfo.map(async (coninfo) => {
      const dirPromises = coninfo.dir.map(async (dirPath) => {
        const result = await processRemoteDirectory(coninfo, dirPath);
        if (result !== null) {
          results.push(result);
        }
      });
      await Promise.allSettled(dirPromises);
    });

    await Promise.allSettled(promises);
    console.log("Resolved results:", results);
    const FTP_data_obj = damsinfo.map((obj1) => {
      obj1.FTPdata = []; // Initialize FTPdata as an empty array for each object in damsinfo
      results.forEach((obj2) => {
        if (obj1.code_name === obj2[0].code_name) {
          obj1.FTPdata.push({
            use_dir: obj2[0].use_dir,
            isdata: obj2[0].isdata,
            header: obj2[0].header,
            file: obj2[0].file,
            status_con: obj2[0].status_con,
          });
        }
      });

      return obj1; // Return the modified object with FTPdata
    });

    console.log(FTP_data_obj);
    return FTP_data_obj;
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = {
  CallFTP,
  CallFTPbyCodeName,
};

// main().catch((err) => {
//   console.error("Error:", err);
// });
