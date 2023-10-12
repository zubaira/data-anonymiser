'use strict';

const propertiesReader = require('properties-reader');
const http = require('https');
const fileSystem = require('fs');
const Client = require('node-rest-client').Client;  
const client = new Client();

const properies = loadProperties() ;

const URL = properies.get('server.url');
const API_TOKEN = 'ApiToken ' + properies.get('server.token');


let getRequestArgs = {
    headers: { 
        "Content-Type": "application/json",
        "Authorization": `ApiToken ${API_TOKEN}`,
        "Accept":"application/json"
    }
};

let downloadData = (getRequestArgs) => {
        return new Promise((resolve,reject) => {
            client.get( URL, getRequestArgs, (data, response) => {
                    if ( response.statusCode === 200){
                        console.log('statusCode: ' + response.statusCode );
                        console.log( JSON.stringify(data));
                        resolve('Data downloaded');
                    
                    }
                    else{
                            reject('Connection with server ' + URL +' refused with statusCode: ' + response.statusCode)
                    }
            });
        });
}

let startDownload = async () => {
    downloadData(getRequestArgs).then( data => { console.log( data )}).catch(  error => {console.error(error); process.exit()} );
}

startDownload();


function loadProperties()
{
    if ( !fileSystem.existsSync("properties.file")){
        console.error('Properties file not found');
        process.exit();
    }

    console.log('Loading properties from file');
    return new propertiesReader("properties.file");
}
