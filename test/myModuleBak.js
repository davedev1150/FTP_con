const ftp = require("ftp");
const fs = require("fs").promises;
const path = require("path");
const csv = require("csv-parser");
const { MongoClient } = require("mongodb");
const util = require("util");
const { log } = require("console");
async function readAndParseJSONFile() {

  
  try {
    const filePath = path.join(__dirname, "FTP_dir_arr.json");

    // Read the JSON file and await the result
    const data = await fs.readFile(filePath, "utf8");

    // Parse the JSON data
    const makeDir = JSON.parse(data);

    return makeDir;
  } catch (error) {
    console.error("Error:", error);
    throw error;
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

//findDocuments();

async function CallFTP() {
  const resultsArray = [];
  const makeDir = await findDocuments();
  let status_con = false;
  try {
    for (const server of makeDir) {
      const client = new ftp();
      await new Promise((resolve, reject) => {
        client.connect({
          host: server.host,
          user: server.user,
          password: server.password,
        });

        client.on("ready", async () => {
          console.log(`Connected to FTP server at ${server.name}`);
          status_con = true;
          for (const dirPath of server.dir) {
            await new Promise((resolveDir, rejectDir) => {
              client.cwd(dirPath, (err, newCurrentDir) => {
                if (err) {
                  console.error(
                    `Error changing remote directory at ${server.name} to ${dirPath}:`,
                    err
                  );
                  rejectDir(err);
                } else {
                  console.log(`Remote directory changed to: ${dirPath}`);
                  client.list((err, newList) => {
                    if (err) {
                      console.error(
                        `Error listing remote directory at ${server.name}:`,
                        err
                      );
                      rejectDir(err);
                    } else {
                      console.log(
                        `Remote directory listing at ${server.name}:`
                      );
                      newList.sort((a, b) => b.date - a.date);

                      // Download and read a file (e.g., first file in the directory)
                      const fileToDownload = newList[0];
                      if (fileToDownload && fileToDownload.type === "-") {
                        client.get(fileToDownload.name, (err, stream) => {
                          if (err) {
                            console.error(
                              `Error downloading file ${fileToDownload.name} from ${server.name}:`,
                              err
                            );
                            rejectDir(err);
                          } else {
                            let results = [];

                            // Read the file contents
                            stream
                              .pipe(csv({ headers: true }))
                              .on("data", (data) => {
                                results.push(data);
                                // Here, 'data' represents each row in the CSV
                              });

                            stream.on("end", () => {
                              //console.log("res=",results);
                              // Assuming the first row contains headers
                              if (results.length > 1) {
                                const data = results.map((obj) =>
                                  Object.values(obj)
                                );
                                // console.log("Headers:", data[0]);
                                // console.log("Values:", data[1]);
                                const filteredHeaders = data[0].filter(
                                  (_, index) => data[1][index] == "  NAN"
                                );
                                if (filteredHeaders.length > 1) {
                                  console.log(
                                    `${server.name} is NAN`,
                                    filteredHeaders,
                                    fileToDownload.name
                                  );
                                  resultsArray.push({
                                    name: server.name,
                                    code_name: server.code_name,
                                    be_under: server.be_under,
                                    use_dir: dirPath,
                                    isdata: true,
                                    header: filteredHeaders,
                                    file: fileToDownload.name,
                                    status_con: status_con,
                                  });
                                } else {
                                  console.log(`${server.name} OK`);
                                  resultsArray.push({
                                    name: server.name,
                                    code_name: server.code_name,
                                    be_under: server.be_under,
                                    use_dir: dirPath,
                                    isdata: true,
                                    header: filteredHeaders,
                                    file: fileToDownload.name,
                                    status_con: status_con,
                                  });
                                }

                                resolveDir();
                              } else {
                                console.log("Nodata");
                                resultsArray.push({
                                  name: server.name,
                                  code_name: server.code_name,
                                  be_under: server.be_under,
                                  use_dir: dirPath,
                                  isdata: false,
                                  header: [],
                                  file: fileToDownload.name,
                                  status_con: status_con,
                                });
                                resolveDir();
                              }
                            });

                            stream.on("error", (err) => {
                              console.error(
                                `Error reading file ${fileToDownload.name}:`,
                                err
                              );
                              rejectDir(err);
                            });
                          }
                        });
                      } else {
                        resolveDir();
                      }
                    }
                  });
                }
              });
            });
          }

          client.end();
          resolve();
        });

        client.on("error", (err) => {
          status_con = false;
          console.error(
            `Error connecting to FTP server at ${server.user}:`,
            err
          );
          resultsArray.push({
            name: server.name,
            code_name: server.code_name,
            be_under: server.be_under,
            use_dir: dirPath,
            isdata: false,
            header: filteredHeaders,
            file: fileToDownload.name,
            status_con: status_con,
          });
          reject(err);
        });
      });
    }

    const FTP_data_obj = makeDir.map((obj1) => {
      obj1.FTPdata = []; // Initialize FTPdata as an empty array

      resultsArray.forEach((obj2) => {
        if (obj1.code_name === obj2.code_name) {
          obj1.FTPdata.push({
            use_dir: obj2.use_dir,
            isdata: obj2.isdata,
            header: obj2.header,
            file: obj2.file,
            status_con: obj2.status_con,
          });
        }
      });

      return obj1;
    });

    console.log(FTP_data_obj);
    // Convert FTP_data_obj to JSON string
    const ftpDataJSON = JSON.stringify(FTP_data_obj, null, 2);

    // Save the JSON data to a file for debugging
    const debugFilePath = path.join(__dirname, "debug_output.json");
    await fs.writeFile(debugFilePath, ftpDataJSON, "utf8");
    console.log("FTP_data_obj saved to debug_output.json");

    return FTP_data_obj;
  } catch (error) {
    console.error("Error:", error);
  }
}
CallFTP();
module.exports = {
  CallFTP,
};
