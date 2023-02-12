const redis = require('redis');


// redis[s]://[[username][:password]@][host][:port][/db-number]
const client = redis.createClient({
    url: "redis://@192.168.30.7:6379/0"
});
client.on('ready', function (res) {
    console.log('redis ready:');
});

client.on('end', function (err) {
    console.log('redis end:' + err);
});

client.on('error', function (err) {
    console.log("redis error:", err);
});

client.on('connect', function () {
    console.log('redis connect success!');
});


module.exports = {
    set(key, val) {
        return new Promise((ret, rej) => {
            client.set(key, val, (err, data) => {
                if (err) {
                    rej(err);
                    return;
                }
                ret(data);
            });
        })
    },
    get(key) {
        return new Promise((ret, rej) => {
            client.get(key, (err, data) => {
                if (err) {
                    rej(err);
                    return;
                }
                ret(data);
            });
        })
    }
};


