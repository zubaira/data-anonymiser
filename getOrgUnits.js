'use strict';
const http = require('https');
const Client = require('node-rest-client').Client;  
const client = new Client();

const URL = "https://demo.pakdhis2.org/api/organisationUnitGroups/QSKdbtmrMj9.json";

let getRequestArgs = {
    headers: { 
        "Content-Type": "application/json",
        "Authorization": "ApiToken d2pat_qz022f7AxyA2b6uuS4RHutyDZyt6RDgF4274123802",
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
