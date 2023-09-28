const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0", // Specify the OpenAPI version
    info: {
      title: "Your API Title",
      version: "1.0.0",
      description: "Your API description",
    },
    servers: [
      {
        url: "http://ftpapiv2.nasgfe1.synology.me", // Specify your server's host and port
        description: "Nas Server", // Optional description
      },
      // Add more server entries if needed (e.g., for different environments)
    ],
  },
  // API routes to be documented
  apis: ["app.js"],
};

module.exports = swaggerJSDoc(options);
