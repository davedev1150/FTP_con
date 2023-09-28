// server.js
const express = require("express");
const app = express();
const port = process.env.PORT || 3060;
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swaggerConfig");
const bson = require("bson")

const CallFTP = require("./newCallFTP");
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * @swagger
 * /FTP:
 *   get:
 *     summary: Get FTP results
 *     description: Retrieve FTP results.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */
app.get("/FTP", async (req, res) => {
  try {
    // Assuming CallFTP is an asynchronous function that returns results
    const results = await CallFTP.CallFTP();

    // Respond with the results in JSON format
    res.json(results);
  } catch (error) {
    // Handle any errors that occur during the FTP call or processing here
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

/**
 * @swagger
 * /FTP:
 *   get:
 *     summary: Get FTP results By Dam CodeName
 *     description: Retrieve FTP By Dam CodeName
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */
app.get("/FTP/:codename", async (req, res) => {
  try {
    const codename = req.params.codename;
    // Assuming CallFTP is an asynchronous function that returns results
    const results = await CallFTP.CallFTPbyCodeName(codename);

    // Respond with the results in JSON format
    res.json(results);
  } catch (error) {
    // Handle any errors that occur during the FTP call or processing here
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
