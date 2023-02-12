let { ThreadPools } = require("./common/works/works.js");
let path = require("path");
let testPools = new ThreadPools(10, 100, "test", {
    a(data) {
        return data + 1;
    }
})

let test1Pools = new ThreadPools(10, 50, "test", {
    a(data) {
        test();
    }
})
let count = 0;
setInterval(() => {
    console.log("并发:", count);
    count = 0;
}, 1000);

setInterval(() => {
    count++;
}, 2);

async function test() {
    count++;
    let result = await testPools.execFile({
        scriptFile: getAbsolutePath("./src/test.js"),
        method: "test"
    }, 1);
    return result;
}


function getAbsolutePath(url) {
    return path.resolve(__dirname, url);
}

async function test1() {
    let result = await test1Pools.execFile({
        scriptFile: getAbsolutePath("./src/test1.js"),
        method: "test"
    }, 1);
    return result;
}

test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
test1();
