const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");

const graphQLSchema = require("./graphql/schema");
const graphQLResolver = require("./graphql/resolvers");
const auth = require("./middlewares/auth");
const { clearImage } = require("./util/file");

const MONGODB_URI =
  "mongodb+srv://root:wUkLd5QqMMX7vQgQ@shop.bcjtd.mongodb.net/feeds";

const app = express();

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, "images");
  },
  filename: (request, file, callback) => {
    callback(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (request, file, callback) => {
  const validMimeType =
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg";
  callback(null, validMimeType);
};

app.use(bodyParser.json());
app.use(multer({ storage, fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  if (request.method === "OPTIONS") {
    return response.sendStatus(200);
  }
  next();
});

app.use((error, request, response, next) => {
  console.log(error);
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;

  response.status(status).json({ message, data });
});

app.use(auth);

app.put("/post-image", (request, response, next) => {
  if (!request.isAuth) {
    throw new Error("Not Authenticated");
  }

  if (!request.file) {
    return response.status(200).json({
      message: "No file provided",
    });
  }

  if (request.body.oldPath) {
    clearImage(request.body.oldPath);
  }

  return response.status(201).json({
    message: "File Stored",
    filePath: request.file.path.replace("\\", "/"),
  });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphQLSchema,
    rootValue: graphQLResolver,
    graphiql: true,
    customFormatErrorFn(error) {
      if (!error.originalError) {
        return error;
      }

      const data = error.originalError.data;
      const message = error.message || "An error occurred.";
      const code = error.originalError.code || 500;

      return {
        message,
        code,
        data,
      };
    },
  })
);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    const server = app.listen(8080);
    const io = require("./socket").init(server);

    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((error) => console.log(error));
