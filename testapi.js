const axios = require("axios");

// Define the API endpoint URL
const apiURL = "https://ftpapi2.nasgfe1.synology.me/FTP";

// Make a GET request to the API
axios
  .get(apiURL)
  .then(function (response) {
    // Handle the successful response
    console.log("Response data:", response.data);
  })
  .catch(function (error) {
    // Handle any errors that occurred during the request
    console.error("Error:", error);
  });
