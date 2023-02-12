const { Thread } = require('./work_run.js');
const { workerData, Worker, parentPort } = require('worker_threads');
if (workerData && workerData.type == "ThreadPools") {
    let globalOption = workerData.globalOption;
    class ThreadPoolsWorker {
        threadPools = [];
        threadPoolsMap = {};
        size;
        maxSize;
        prefix;
        globalRetMap = {};
        constructor(size, maxSize, prefix) {
            for (let i = 0; i < size; i++) {
                let thead = new Thread(i, globalOption);
                thead.name = prefix + "-thead-" + i;
                this.threadPools.push(thead);
                this.threadPoolsMap[i] = thead;

            }
            this.maxSize = maxSize;
            this.prefix = prefix;
        }
        async exec(res) {
            let thread = await this.getThread();

            let result = await thread.exec(res);
            parentPort.postMessage(result);
        }
        global(res) {
            let thread = this.threadPoolsMap[res.threadId];
            thread.global(res);
        }

        async getThread() {
            let thread;
            while (true) {
                thread = this.threadPools.find(res => !res.isExec);
                if (!thread) {
                    thread = this.createThread();
                }
                if (!thread) {
                    await this.sleepFind();
                    continue;
                }
                if (thread) {
                    break;
                }
            }
            thread.isExec = true;
            return thread;
        }
        async sleepFind() {
            return new Promise((ret, rej) => {
                setTimeout(() => {
                    ret();
                }, 0);
            })
        }

        createThread() {
            if (this.maxSize < this.threadPools.length) {
                return;
            }
            let thead = new Thread(this.threadPools.length, globalOption);
            thead.name = this.prefix + "-thead-" + this.threadPools.length;
            this.threadPools.push(thead);
            this.threadPoolsMap[thead.id] = thead;
            return thead;
        }

    }
    let poolsWorker = new ThreadPoolsWorker(workerData.size, workerData.maxSize, workerData.prefix);
    parentPort.on("message", (res) => {
        poolsWorker[res.type](res);
    })
    return;
}
class ThreadPools {
    size;
    maxSize;
    prefix;
    worker;
    ret;
    idNum;
    proMap = {};
    global = {};
    globalOption = {};
    constructor(size, maxSize, prefix, globalOption) {
        this.size = size;
        this.maxSize = maxSize;
        this.prefix = prefix;
        this.global = globalOption;
        this.globalOption = this.disGlobalOption(globalOption);
        this.worker = new Worker(__filename, {
            workerData: {
                size, maxSize, prefix, type:
                    "ThreadPools", globalOption: this.globalOption
            }
        });
        this.worker.on("message", (res) => this.messageCall(res));
    }
    disGlobalOption(globalOption) {
        return this.disObject(globalOption);
    }
    disObject(obj) {
        let result = {};
        for (let key in obj) {
            let temp = obj[key];
            if (typeof temp == "string" || temp instanceof Array) {
                result[key] = temp;
                continue;
            }
            if (temp instanceof Function) {
                result[key] = "thread-function";
                continue;
            }
            if (typeof temp == "object") {
                result[key] = this.disObject(temp);
                temp
            }
        }
        return result;
    }
    async exec(option) {
        let data = this.getData(option);
        let result = await this.getResult(data);

        return result.data;
    }
    async execFile() {
        let data = this.disArguments(arguments);
        data.option.type = "execFile";
        let result = await this.exec(data);
        return result;
    }
    async execJs() {
        let data = this.disArguments(arguments);
        data.option.type = "execJs";
        let result = await this.exec(data);
        return result;
    }
    disArguments(arg) {
        let temp = [].slice.apply(arg);
        let option = temp[0];
        let data = temp.slice(1);
        return { option, data }
    }
    getData(data) {
        return {
            type: "exec",
            id: this.getIdNum(),
            data
        }
    }
    getIdNum() {
        this.idNum = this.idNum < 100000 ? (this.idNum + 1) : 0;
        return this.idNum;
    }
    messageCall(res) {
        this.messageCallFun[res.type].apply(this, [res]);
    }

    messageCallFun = {
        exec(res) {
            this.proMap[res.id](res);
        },
        async global(res) {
            let keys = res.keys;
            let temp = this.global;
            let that = this.global;
            for (let i in keys) {
                let key = keys[i];
                that = temp;
                temp = temp[key];
            }
            let result = await temp.apply(that, res.data);
            let sendData = {
                id: res.id,
                data: result,
                type: res.type,
                threadId: res.threadId
            };
            this.worker.postMessage(sendData);
        }
    }
    async getResult(option) {
        this.pro = new Promise((ret) => this.proMap[option.id] = ret);
        this.worker.postMessage(option);
        let result = await this.pro;
        this.isExec = false;
        return result;
    }
}
module.exports = { ThreadPools }