const ftp = require("ftp");
const fs = require("fs").promises;
const path = require("path");
const csv = require("csv-parser");
const { MongoClient } = require("mongodb");

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

async function CallFTP() {
  const makeDir = await findDocuments();
  const resultsArray = [];

  try {
    await Promise.all(
      makeDir.map(async (server) => {
        const client = new ftp();
        let status_con = false;

        try {
          await new Promise((resolve, reject) => {
            client.on("ready", async () => {
              console.log(`Connected to FTP server at ${server.name}`);
              status_con = true;
              let filteredHeaders = [];
              await Promise.all(
                server.dir.map(async (dirPath) => {
                  await new Promise((resolveDir, rejectDir) => {
                    client.cwd(dirPath, async (err, newCurrentDir) => {
                      let results = [];
                      if (err) {
                        console.error(
                          `Error changing remote directory at ${server.name} to ${dirPath}:`,
                          err
                        );
                        rejectDir(err);
                      } else {
                        console.log(`Remote directory changed to: ${dirPath}`);
                        client.list(async (err, newList) => {
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
                              client.get(
                                fileToDownload.name,
                                async (err, stream) => {
                                  if (err) {
                                    console.error(
                                      `Error downloading file ${fileToDownload.name} from ${server.name}:`,
                                      err
                                    );
                                    rejectDir(err);
                                  } else {
                                    // Read the file contents
                                    stream
                                      .pipe(csv({ headers: true }))
                                      .on("data", (data) => {
                                        results.push(data);
                                        // Here, 'data' represents each row in the CSV
                                      });
                                    //console.log("results", results);
                                    stream.on("end", () => {
                                      if (results.length > 1) {
                                        const data = results.map((obj) =>
                                          Object.values(obj)
                                        );
                                        const filteredHeaders = data[0].filter(
                                          (_, index) =>
                                            data[1][index] === "  NAN"
                                        );
                                        if (filteredHeaders.length > 1) {
                                          console.log(
                                            `${server.name} is NAN`,
                                            filteredHeaders,
                                            fileToDownload.name,dirPath
                                          );
                                          resultsArray.push({
                                            name: server.name,
                                            code_name: server.code_name,
                                            be_under: server.be_under,
                                            use_dir: dirPath,
                                            isdata: results.length > 1,
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
                                            isdata: results.length > 1,
                                            header: filteredHeaders,
                                            file: fileToDownload.name,
                                            status_con: status_con,
                                          });
                                        }
                                      } else {
                                        console.log("Nodata");
                                        resultsArray.push({
                                          name: server.name,
                                          code_name: server.code_name,
                                          be_under: server.be_under,
                                          use_dir: dirPath,
                                          isdata: results.length > 1,
                                          header: filteredHeaders,
                                          file: fileToDownload.name,
                                          status_con: status_con,
                                        });
                                      }
                                      //console.log("resultsArray", resultsArray);
                                      resolveDir();
                                    });

                                    stream.on("error", (err) => {
                                      console.error(
                                        `Error reading file ${fileToDownload.name}:`,
                                        err
                                      );
                                      rejectDir(err);
                                    });
                                  }
                                }
                              );
                            } else {
                              resolveDir();
                            }
                          }
                        });
                      }
                    });
                  });
                })
              );

              client.end();
              resolve();
            });

            client.on("error", (err) => {
              status_con = false;
              console.error(
                `Error connecting to FTP server at ${server.user}:`,
                err
              );
              reject(err);
            });

            client.connect({
              host: server.host,
              user: server.user,
              password: server.password,
              connTimeout: 300000,
              pasvTimeout: 300000,
              keepalive: 300000,
            });
          });
        } catch (error) {
          console.error("Error:", error);
        }
      })
    );

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

    console.log(FTP_data_obj.FTPdata);
    return FTP_data_obj;
  } catch (error) {
    console.error("Error:", error);
  }
}
//CallFTP()

module.exports = {
  CallFTP,
};

// CallFTP();

// async function measureExecutionTime() {
//   const startTime = performance.now();

//   // Call your function here
//   await CallFTP();

//   const endTime = performance.now();
//   const executionTime = endTime - startTime;

//   console.log(`Function execution time: ${executionTime} milliseconds`);
// }

// // measureExecutionTime();
