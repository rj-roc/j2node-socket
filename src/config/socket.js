const { parentPort } = require('worker_threads');

const net = require('net');

// const worker = require('worker_threads');
// console.log(worker);
const socketConfig = {
    //js路径
    modulesFiles: "",
    //所有的处理
    allFunctions: "",
    //socket客户端
    client: "",
    host: "",
    port: 1428,
    localName: "",
    start(config) {
        socketConfig.host = config.server;
        socketConfig.localName = config.localName;

        socketConfig.createConnection();

        socketConfig.client.send = socketConfig.send;

        socketConfig.client.on('data', socketConfig.dataCall);

        socketConfig.client.on('close', socketConfig.closeCall);

        socketConfig.client.on('error', socketConfig.errorCall);
        return "启动成功";
    },
    load() {
        console.log("env:" + process.env.NODE_ENV);
        if (process.env.NODE_ENV == "production") {
            socketConfig.allFunctions = { main: { index(res) { return res } } }
            return;
        }
        var requireContext = require('node-require-context')
        var modulesFiles = requireContext("../main/", true, /.js$/);

        socketConfig.modulesFiles = modulesFiles;
        socketConfig.allFunctions = modulesFiles.keys().reduce((res, modulePath) => {
            const modules = modulesFiles(modulePath);
            let entityKey = modulePath.substring(modulePath.lastIndexOf("\\") + 1, modulePath.length - 3);
            res[entityKey] = modules;
            return res;
        }, {});
    },
    createConnection() {
        let client = net.createConnection(socketConfig.port, socketConfig.host, socketConfig.createConnectionCall);
        socketConfig.client = client;
    },
    createConnectionCall() {
        console.log(`socket 连接成功connection: ${socketConfig.host}:${socketConfig.port}`);
        socketConfig.send({
            type: "init",
            data: socketConfig.localName
        });
    },
    send(data) {
        socketConfig.client.write(JSON.stringify(data) + "\n")
    },
    dataCall(dataStr) {
        try {
            let data = JSON.parse(dataStr);
            socketConfig.dataParse[data.type](data);
        } catch (error) {
            console.log(dataStr);
            socketConfig.client.emit("close");
            parentPort.postMessage("close");
            return;
        }
       
    },
    closeCall(error) {
        console.log('close:连接已断开 ' + error);
    },
    errorCall(error) {
        console.log('error: ' + error);
    },
    dataParse: {
        close(data) {
            
            let result = {
                id: data.id,
                code: 1,
                msg: "操作成功"
            }
            socketConfig.send(result);
            socketConfig.client.emit("close");
            parentPort.postMessage("close");
        },
        async script(data) {
            let optionData = JSON.parse(data.data);
            let result = {
                id: data.id
            }
            let wrap = socketConfig.allFunctions[optionData.scriptName];
            if (!wrap) {
                result.code = 0;
                result.msg = "未找到文件";
                socketConfig.send(result);
                return;
            }
            let m = wrap[optionData.method];
            if (!m) {
                result.code = 0;
                result.msg = "未找到方法";
                socketConfig.send(result);
                return;
            }

            try {
                let resultData = await m(optionData.data);
                result.data = resultData;
                result.code = 1;
            } catch (error) {
                result.code = 0;
                result.msg = error.message;
            }

            socketConfig.send(result);
        }
    }
};
socketConfig.load();


module.exports = socketConfig;