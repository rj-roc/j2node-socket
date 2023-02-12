
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '192.168.30.6',
    user: 'root',
    password: 'Sunpeng1234.',
    database: 'datamation'
});
connection.connect();
module.exports = connection;