const ftp = require("ftp");
const xlsx = require("xlsx");
const path = require("path");
const client = new ftp();
const DamModel = require("../db");
const fs = require("fs");

const filePath = path.join(__dirname, "FTP_dir_arr.json");

(async () => {
  try {
    // Read the JSON file and await the result
    const data = await fs.promises.readFile(filePath, "utf8");
    const makeDir = JSON.parse(data);
    console.log(makeDir);
    for (const server of makeDir) {
      const client = new ftp();

      // Connect to the FTP server
      await new Promise((resolve, reject) => {
        client.connect({
          host: server.host,
          user: server.user,
          password: server.password,
        });

        // Event handler for when the client is ready
        client.on("ready",  () => {
          console.log(`Connected to FTP server at ${server.name}`);
          for (const dirPath of server.dir) {
            
             client.cwd(dirPath, (err, currentDir) => {
                console.log(dirPath);
              if (err) {
                console.error(
                  `Error changing remote directory at ${server.name}:`,
                  err
                );

              } else {
                console.log(`Remote directory changed to: ${dirPath}`);
                // List files and directories in the current remote directory
                client.list((err, newList) => {
                  if (err) {
                    console.error(
                      `Error listing remote directory at ${server.name}:`,
                      err
                    );
                  } else {
                    console.log(`Remote directory listing at ${server.name}:`);
                    newList.sort((a, b) => b.date - a.date);

                    console.log(newList[0]);

                    //   // Get the first file in the directory
                    //   const firstFile = newList.find((item) => item.type === "-");
                    //   console.log(`First file in ${server.dir}:`);
                    //   console.log(firstFile);

                    // Close the FTP connection
                   
                    resolve();
                  }
                });
              }
            });
          }
        });

        // Event handler for error
        client.on("error", (err) => {
          console.error(
            `Error connecting to FTP server at ${server.user}:`,
            err
          );
        });
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
