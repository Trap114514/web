const mysql = require('mysql');

//Create the connection with database 
const createConnection = () => {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',  //MySQL username
        password: '123456',  // MySQL code
        database: 'crowdfunding_db'
    });
};

//Connect with database
const connectToDatabase = (connection) => {
    connection.connect(err => {
        if (err) {
            console.error('Fail to connect with database: ', err.stack);
        } else {
            console.log('Connect with database successfully');
        }
    });
};

//Main logic
const connection = createConnection();
connectToDatabase(connection);

//Export the connection
module.exports = connection;