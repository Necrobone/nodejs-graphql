const path = require("path");
const fs = require("fs");

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, (error) => console.log(error));
};

exports.clearImage = clearImage;
