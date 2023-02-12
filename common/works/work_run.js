const { Worker, parentPort, workerData } = require("worker_threads");

if (workerData && workerData.type == "Thread") {
    let runInterval = setInterval(() => {
    }, 1000 * 60);

    let scriptFileMap = {};

    class ThreadWork {
        globalPromiseMap = {};
        globalIdNum = 0;
        constructor() {
            this.disGlobalOption(workerData.globalOption);
        }

        disGlobalOption(globalOption) {
            let result = this.disObject(globalOption, []);
            for (let key in result) {
                global[key] = result[key];
            }
        }

        disObject(obj, parentKeys) {
            let result = {};
            for (let key in obj) {
                let temp = obj[key];
                if (typeof temp == "string") {
                    if (temp == "thread-function") {
                        result[key] = this.getGlobalFunction(this.concatKey(parentKeys, key));
                        continue;
                    }
                    result[key] = temp;
                    continue;
                }
                if (temp instanceof Array) {
                    result[key] = temp;
                    continue;
                }
                if (typeof temp == "object") {
                    result[key] = this.disObject(temp, this.concatKey(parentKeys, key));
                }
            }
            return result;
        }

        concatKey(parentKeys, key) {
            return parentKeys.concat([key]);
        }

        getGlobalFunction(keys) {
            let that = this;
            return async function () {
                let data = [].slice.apply(arguments);
                let ret;
                let id = that.getGlobalIdNum();
                let promise = new Promise((tret) => ret = tret);
                that.globalPromiseMap[id] = ret;
                parentPort.postMessage({
                    type: "global",
                    keys,
                    id,
                    data
                })
                let result = await promise;
                return result.data;
            }
        }

        getGlobalIdNum() {
            this.globalIdNum++;
            if (this.globalIdNum > 1000000) {
                this.globalIdNum = 0;
            }
            return this.globalIdNum;
        }

        funs = {
            async execFile(res) {
                let option = res.option;
                let scriptFile = option.scriptFile;
                let m = scriptFileMap[scriptFile];
                if (!m) {
                    m = require(scriptFile);
                    scriptFileMap[scriptFile] = m;
                }
                return await m[option.method].apply(m, res.data);
            },
            async execJs(res) {
                let option = res.option;
                let script = option.script;
                let m = scriptFileMap[script];
                if (!m) {
                    m = eval(script);
                    scriptFileMap[script] = m;
                }
                return await m[option.method].apply(m, res.data);
            },
            async close() {
                clearInterval(runInterval);
            }
        }

        async exec(res) {
            let data = res.data;
            let option = data.option;
            let result = await this.funs[option.type].apply(this, [data]);
            let resultData = { data: result, id: res.id, type: res.type };
            parentPort.postMessage(resultData);
        }

        global(res) {
            this.globalPromiseMap[res.id](res);
        }

    }

    let threadWork = new ThreadWork();

    function disMessage(res) {
        threadWork[res.type](res);
    }

    parentPort.on("message", (res) => {
        disMessage(res);
    })

    return;

}


class Thread {
    id;
    isRun = false;
    isExec = false;
    ret;
    promise;
    worker;
    name;

    constructor(id, globalOption) {
        this.id = id;
        this.worker = new Worker(__filename, {
            workerData: {
                type: "Thread",
                globalOption
            }
        });

        this.worker.on("message", (res) => this.messageCall(res));
        this.worker.on("exit", () => this.onClose());
        this.isRun = true;
    }

    async exec(res) {
        this.isExec = true;
        return await this.getResult(res);
    }

    async getResult(option) {
        this.pro = new Promise((ret) => this.ret = ret);
        this.worker.postMessage(option);
        let result = await this.pro;
        this.isExec = false;
        return result;
    }

    global(res) {
        this.worker.postMessage(res);
    }

    callFuns = {
        exec(res) {
            this.ret(res);
        },
        global(data) {
            data.threadId = this.id;
            parentPort.postMessage(data);
        }
    }

    messageCall(res) {
        this.callFuns[res.type].apply(this, [res]);
    }

    onClose() {
        this.isRun = false;
    }

}

module.exports = { Thread }