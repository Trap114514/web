const expressApp = require('express');
const pathLib = require('path');
const databaseConnection = require('./db'); // 引入 MySQL 数据库连接模块
const expressServer = expressApp(); // 创建 Express 应用实例

// 配置静态文件目录
const publicDirectory = pathLib.join(__dirname, 'public');
expressServer.use(expressApp.static(publicDirectory));

// 定义视图文件存放路径
const viewsDirectory = pathLib.join(__dirname, 'views');

// 错误处理函数，接收响应对象和错误信息
const respondWithError = (response, error) => {
    console.error(error); // 在控制台输出错误信息
    response.status(500).json({ error: error.message }); // 返回 500 状态和错误信息
};

// 发送 HTML 文件的函数，接受响应对象和文件名
const sendHtmlFile = (response, fileName) => {
    const fullFilePath = pathLib.join(viewsDirectory, fileName); // 生成完整的文件路径
    response.sendFile(fullFilePath); // 发送 HTML 文件
};

// 首页路由 - 当请求根路径时返回 index.html
expressServer.get('/', (request, response) => sendHtmlFile(response, 'index.html'));

// 搜索页面路由 - 返回 search.html
expressServer.get('/search', (request, response) => sendHtmlFile(response, 'search.html'));

// 通用数据库查询函数
const queryDatabase = (sqlQuery, parameters) => {
    return new Promise((resolve, reject) => {
        databaseConnection.query(sqlQuery, parameters, (error, results) => {
            if (error) return reject(error); // 如果有错误，拒绝 Promise
            resolve(results); // 成功时解析结果
        });
    });
};

// API：获取所有类别
expressServer.get('/api/categories', async (request, response) => {
    const sqlForCategories = 'SELECT CATEGORY_ID, NAME FROM CATEGORY'; // 查询类别的 SQL
    try {
        const categoryResults = await queryDatabase(sqlForCategories, []); // 执行查询
        response.json(categoryResults); // 返回类别结果
    } catch (error) {
        respondWithError(response, error); // 错误处理
    }
});

// API：获取所有组织者
expressServer.get('/api/organizers', async (request, response) => {
    const sqlForOrganizers = 'SELECT DISTINCT ORGANIZATION FROM FUNDRAISER'; // 查询组织者的 SQL
    try {
        const organizerResults = await queryDatabase(sqlForOrganizers, []); // 执行查询
        response.json(organizerResults); // 返回组织者结果
    } catch (error) {
        respondWithError(response, error); // 错误处理
    }
});

// API：获取所有城市
expressServer.get('/api/cities', async (request, response) => {
    const sqlForCities = 'SELECT DISTINCT CITY FROM FUNDRAISER'; // 查询城市的 SQL
    try {
        const cityResults = await queryDatabase(sqlForCities, []); // 执行查询
        response.json(cityResults); // 返回城市结果
    } catch (error) {
        respondWithError(response, error); // 错误处理
    }
});

// 筹款活动详情页面路由 - 返回 fundraiser.html
expressServer.get('/fundraiser/:id', (request, response) => sendHtmlFile(response, 'fundraiser.html'));

// 获取所有正在进行的筹款活动
expressServer.get('/api/fundraisers', async (request, response) => {
    const sqlForFundraisers = `
        SELECT f.FUNDRAISER_ID, f.ORGANIZATION, f.TITLE, f.TARGET_FUNDING, f.CURRENT_FUNDING, f.CITY, f.EVENT_DATE, c.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER f 
        JOIN CATEGORY c ON f.CATEGORY_ID = c.CATEGORY_ID
        WHERE f.CURRENT_FUNDING < f.TARGET_FUNDING`; // 查询正在进行的筹款活动的 SQL

    try {
        const fundraiserResults = await queryDatabase(sqlForFundraisers, []); // 执行查询
        response.json(fundraiserResults); // 返回筹款活动结果
    } catch (error) {
        respondWithError(response, error); // 错误处理
    }
});

// 搜索筹款活动
expressServer.get('/api/search', async (request, response) => {
    const { organizers, cities, categories } = request.query; // 解构查询参数
    let sqlSearchQuery = `
        SELECT f.FUNDRAISER_ID, f.ORGANIZATION, f.TITLE, f.TARGET_FUNDING, f.CURRENT_FUNDING, f.CITY, f.EVENT_DATE 
        FROM FUNDRAISER f 
        WHERE 1=1`; // 初始化 SQL 查询

    const searchParams = []; // 查询参数数组
    const whereConditions = []; // 条件数组

    // 处理选中的组织者
    if (organizers) {
        whereConditions.push('f.ORGANIZATION IN (?)'); // 添加条件
        searchParams.push(organizers.split(',')); // 添加查询参数
    }

    // 处理选中的城市
    if (cities) {
        whereConditions.push('f.CITY IN (?)'); // 添加条件
        searchParams.push(cities.split(',')); // 添加查询参数
    }

    // 处理选中的类别
    if (categories) {
        whereConditions.push('f.CATEGORY_ID IN (?)'); // 添加条件
        searchParams.push(categories.split(',')); // 添加查询参数
    }

    // 将条件合并到查询中
    if (whereConditions.length > 0) {
        sqlSearchQuery += ' AND ' + whereConditions.join(' AND '); // 拼接条件
    }

    try {
        const searchResults = await queryDatabase(sqlSearchQuery, searchParams); // 执行查询
        response.json(searchResults); // 返回搜索结果
    } catch (error) {
        respondWithError(response, error); // 错误处理
    }
});

// 获取单个筹款活动详情
expressServer.get('/api/fundraiser/:id', async (request, response) => {
    const fundraiserId = request.params.id; // 获取活动 ID
    const sqlForSingleFundraiser = `
        SELECT f.FUNDRAISER_ID, f.ORGANIZATION, f.TITLE, f.TARGET_FUNDING, f.CURRENT_FUNDING, f.CITY, f.EVENT_DATE, c.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER f 
        JOIN CATEGORY c ON f.CATEGORY_ID = c.CATEGORY_ID
        WHERE f.FUNDRAISER_ID = ?`; // SQL 查询

    try {
        const singleFundraiserResults = await queryDatabase(sqlForSingleFundraiser, [fundraiserId]); // 执行查询
        response.json(singleFundraiserResults[0]); // 返回第一个查询结果
    } catch (error) {
        respondWithError(response, error); // 错误处理
    }
});

// 服务器监听端口
const PORT = 3000; // 定义端口号
expressServer.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`); // 启动信息
});