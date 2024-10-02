//Express,path and database-connection module(1)
const expressApp = require('express');
const pathLib = require('path');
//MySQL database-connection module
const databaseConnection = require('./db');
//Create Express application 
const expressServer = expressApp(); 

//Configure static file catalog(2) 
const publicDirectory = pathLib.join(__dirname, 'public');
expressServer.use(expressApp.static(publicDirectory));

//Define the path of view files
const viewsDirectory = pathLib.join(__dirname, 'views');

//Function of operating the error,receiving the reponsible objects and error message(3) 
const respondWithError = (response, error) => {
    console.error(error);//Output the error information on the console
    response.status(500).json({ error: error.message });//Return status-500 and error message 
};

//Function of sending HTML file,receiving responsible objects and file names
const sendHtmlFile = (response, fileName) => {
    const fullFilePath = pathLib.join(viewsDirectory, fileName);//Generate completed file path
    response.sendFile(fullFilePath);//Send the HTML file
};

//Index router:return index.html when requesting the root path(4)
expressServer.get('/', (request, response) => sendHtmlFile(response, 'index.html'));

//Search router:return search.html
expressServer.get('/search', (request, response) => sendHtmlFile(response, 'search.html'));

//General function of querying database(5)
const queryDatabase = (sqlQuery, parameters) => {
    return new Promise((resolve, reject) => {
        databaseConnection.query(sqlQuery, parameters, (error, results) => {
            if (error) return reject(error); //Reject promise if there is error
            resolve(results); //Analyze the result when success
        });
    });
};

//API of obtaining all of the categories 
expressServer.get('/api/categories', async (request, response) => {
    const sqlForCategories = 'SELECT CATEGORY_ID, NAME FROM CATEGORY';//Query the CATEGORY's SQL
    try {
        const categoryResults = await queryDatabase(sqlForCategories, []);//Operating the query
        response.json(categoryResults);//Return the CATEGORY results
    } catch (error) {
        respondWithError(response, error);//Operating the error
    }
});

//API of obtaining all of the organizers
expressServer.get('/api/organizers', async (request, response) => {
    const sqlForOrganizers = 'SELECT DISTINCT ORGANIZATION FROM FUNDRAISER';//Query the ORGANIZER's SQL 
    try {
        const organizerResults = await queryDatabase(sqlForOrganizers, []);//Operating the query
        response.json(organizerResults);//Returnn the ORGANIZER results
    } catch (error) {
        respondWithError(response, error);//Operating the error 
    }
});

//API of obtaining all of the cities 
expressServer.get('/api/cities', async (request, response) => {
    const sqlForCities = 'SELECT DISTINCT CITY FROM FUNDRAISER';//Query the CITY's SQL
    try {
        const cityResults = await queryDatabase(sqlForCities, []);//Operating the query 
        response.json(cityResults);//Return the CITY results
    } catch (error) {
        respondWithError(response, error); //Operating the error
    }
});

//Fundraiser router:return fundraiser.html
expressServer.get('/fundraiser/:id', (request, response) => sendHtmlFile(response, 'fundraiser.html'));

//Function of obtaining all of the ongoing funding
expressServer.get('/api/fundraisers', async (request, response) => {
    const sqlForFundraisers = `
        SELECT f.FUNDRAISER_ID, f.ORGANIZATION, f.TITLE, f.TARGET_FUNDING, f.CURRENT_FUNDING, f.CITY, f.EVENT_DATE, c.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER f 
        JOIN CATEGORY c ON f.CATEGORY_ID = c.CATEGORY_ID
        WHERE f.CURRENT_FUNDING < f.TARGET_FUNDING`; //Query the SQL

    try {
        const fundraiserResults = await queryDatabase(sqlForFundraisers, []); //Operating the query 
        response.json(fundraiserResults); //Return the results
    } catch (error) {
        respondWithError(response, error); //Operating the error
    }
});

//Function of searching the campaign(6)
expressServer.get('/api/search', async (request, response) => {
    const { organizers, cities, categories } = request.query; //Deconstruct the query parameter
    let sqlSearchQuery = `
        SELECT f.FUNDRAISER_ID, f.ORGANIZATION, f.TITLE, f.TARGET_FUNDING, f.CURRENT_FUNDING, f.CITY, f.EVENT_DATE 
        FROM FUNDRAISER f 
        WHERE 1=1`;//Initialize the SQL query

    const searchParams = [];//Query the parameter array
    const whereConditions = [];//Condition-array

    //Operate the chosen organizers 
    if (organizers) {
        whereConditions.push('f.ORGANIZATION IN (?)');//Add the conditions 
        searchParams.push(organizers.split(','));//Add the query parameter
    }

    //Operate the chosen cities
    if (cities) {
        whereConditions.push('f.CITY IN (?)');//Add the conditions 
        searchParams.push(cities.split(','));//Add the query parameter
    }

    //Operate the chosen categories 
    if (categories) {
        whereConditions.push('f.CATEGORY_ID IN (?)');//Add the conditions 
        searchParams.push(categories.split(','));//Add the query parameter 
    }

    //Merge the condition with query 
    if (whereConditions.length > 0) {
        sqlSearchQuery += ' AND ' + whereConditions.join(' AND ');//Put the conditions together
    }

    try {
        const searchResults = await queryDatabase(sqlSearchQuery, searchParams);//Operate the query
        response.json(searchResults);//Return the search results
    } catch (error) {
        respondWithError(response, error);//Operate the error 
    }
});

//Obtain the single details of campaign 
expressServer.get('/api/fundraiser/:id', async (request, response) => {
    const fundraiserId = request.params.id;//Obtain the ID
    const sqlForSingleFundraiser = `
        SELECT f.FUNDRAISER_ID, f.ORGANIZATION, f.TITLE, f.TARGET_FUNDING, f.CURRENT_FUNDING, f.CITY, f.EVENT_DATE, c.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER f 
        JOIN CATEGORY c ON f.CATEGORY_ID = c.CATEGORY_ID
        WHERE f.FUNDRAISER_ID = ?`;//Query the SQL 

    try {
        const singleFundraiserResults = await queryDatabase(sqlForSingleFundraiser, [fundraiserId]);//Operate the query 
        response.json(singleFundraiserResults[0]);//Return the first result
    } catch (error) {
        respondWithError(response, error); //Operate the error 
    }
});

//Server listening port(7)
const PORT = 3001; //Define the port ID 
expressServer.listen(PORT, () => {
    console.log(`Server operate on http://localhost:${PORT}`); //Operate message
});