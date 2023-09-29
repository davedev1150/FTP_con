const fs = require("fs");

// Read certificate and private key files
const cert = fs.readFileSync("./keys/cert.pem");
const key = fs.readFileSync("./keys/privkey.pem");

const https = require("https");

// Create an https.Agent with custom certificate and private key
const customHttpsAgent = new https.Agent({
  cert: cert,
  key: key,
});

const axios = require("axios");

// Define the API URL
const apiUrl = "https://ftptestapi.nasgfe1.synology.me/FTP/huk";

// Make an HTTPS request with the custom agent
axios
  .get(apiUrl, {
    httpsAgent: customHttpsAgent,
  })
  .then((response) => {
    // Handle the response here
    console.log("Response Data:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
