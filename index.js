const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (isMainThread) {
    var mainWorker = new Worker("./index.js");
    mainWorker.on('message', (res) => {
        if (res == "close") {
            mainWorker.terminate();
        }
    });
} else {

    const mysql = require("./src/config/mysqlConfig");
    global.mysql = mysql;

    const redis = require("./src/config/redisConfig");
    global.redis = redis;
    //监听socket
    const socket = require("./src/config/socket.js");
    global.socket = socket;
    socket.start({
        server: "192.168.30.2",
        localName: "192.168.30.8"
    })

    module.exports = socket;

}