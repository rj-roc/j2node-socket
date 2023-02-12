module.exports = {
    test(data) {
        let count = 0;
        return new Promise((ret) => {
            setInterval(() => {
                count++;
                a();
                if (count > 100000) {
                    ret(data + 1);
                }
            }, 2);

        })
    }
}