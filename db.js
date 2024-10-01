const mysql = require('mysql');

// 创建数据库连接
const createConnection = () => {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',  // MySQL 用户名
        password: '123456',  // MySQL 密码
        database: 'crowdfunding_db'
    });
};

// 连接到数据库
const connectToDatabase = (connection) => {
    connection.connect(err => {
        if (err) {
            console.error('连接数据库失败: ', err.stack);
        } else {
            console.log('成功连接数据库');
        }
    });
};

// 主逻辑
const connection = createConnection();
connectToDatabase(connection);

// 导出连接
module.exports = connection;