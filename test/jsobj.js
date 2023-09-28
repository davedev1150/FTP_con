const fs = require("fs");
const axios = require("axios");
const mongoose = require("mongoose");
const DamModel = require('./db')


// Read the JSON file
fs.readFile("data.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the JSON file:", err);
    return;
  }

  try {
    // Parse the JSON data into a JavaScript object
    const FTPData = JSON.parse(data);
    console.log("FTP Data:", FTPData);

    // Make the API request
    axios
      .get("https://dms.gfe.co.th/api/external/dams")
      .then((response) => {
        const damsResponse = response.data;

        // Modify objects from the API response based on matching criteria with FTPData
        const modifiedArray1 = damsResponse.map((obj1) => {
          const matchingObj2 = FTPData.find((obj2) => obj2.code_name === obj1.code_name);

          if (matchingObj2) {
            // Combine properties from obj1 and matchingObj2
            return { ...obj1, Username: matchingObj2.Username, Password: matchingObj2.Password };
          }

          // If no matching object found in FTPData, return obj1 as is
          return obj1;
        });

        console.log("Modified Array:", modifiedArray1);

        // Insert the modified data into MongoDB
        DamModel.insertMany(modifiedArray1)
          .then(() => {
            console.log("Data saved to MongoDB");
          })
          .catch((error) => {
            console.error("Error inserting data into MongoDB:", error);
          });
      })
      .catch((error) => {
        console.error("There was a problem with the API request:", error);
      });
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
});
