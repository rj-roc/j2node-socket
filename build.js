const webpack = require("webpack");

webpack({
    entry: "./index.js",
    target: "node",
    output: {
        path: __dirname + "/dist/",
        filename: "index.js"
    },
    mode: "production",
    devtool: "eval-cheap-module-source-map"
}, (error, status) => {
    console.log(error);
    console.log(status);
})
