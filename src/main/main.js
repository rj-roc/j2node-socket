module.exports = {
    async index(req, res) {
        await redis.set("a", 112);
        let a = await redis.get("a");
        return "测试" + a;
    },
    async test(req){
        return 1;
    }
}