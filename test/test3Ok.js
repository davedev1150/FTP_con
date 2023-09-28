const ftp = require("ftp");
const fs = require("fs").promises; // Import 'promises' from 'fs' for async file operations
const path = require("path");
const { count } = require("./db");

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
    throw error; // Re-throw the error to propagate it
  }
}

async function changeDirectories() {
  const makeDir = await readAndParseJSONFile();
  let count = 0;
  try {
    for (const server of makeDir) {
      count += 1;
      // Iterate over 'makeDir' instead of 'serverConfig'
      const client = new ftp();
      // Connect to the FTP server
      await new Promise((resolve, reject) => {
        client.connect({
          host: server.host,
          user: server.user,
          password: server.password,
        });

        // Event handler for when the client is ready
        client.on("ready", async () => {
          console.log(`Connected to FTP server at ${server.name}`);

          // Loop through the directories in the dir array
          for (const dirPath of server.dir) {
            await new Promise((resolveDir, rejectDir) => {
              // Log the current directory before changing
              client.cwd(dirPath, (err, CurrentDir) => {
                if (err) {
                  console.error(
                    `Error changing remote directory at ${server.name} to ${dirPath}:`,
                    err
                  );
                } else {
                  console.log(`Remote directory changed to: ${dirPath}`);
                  client.list((err, newList) => {
                    if (err) {
                      console.error(
                        `Error listing remote directory at ${server.name}:`,
                        err
                      );
                    } else {
                      console.log(
                        `Remote directory listing at ${server.name}:`
                      );
                      newList.sort((a, b) => b.date - a.date);

                      console.log(newList[0]);

                      // Resolve the inner promise to move to the next directory
                      resolveDir();
                    }
                  });
                }
              });
            });
          }

          // Close the FTP connection after processing all directories
          client.end();
          resolve();
        });
        // Event handler for error
        client.on("error", (err) => {
          console.error(
            `Error connecting to FTP server at ${server.user}:`,
            err
          );
          reject(err);
        });
      });
    }
    console.log("total :",count);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the function to change directories
changeDirectories();
