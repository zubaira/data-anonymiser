
'use strict';
import fetch from 'node-fetch';
import fs  from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';
import { stringify } from 'querystring';

const properties = loadProperties();

// URL to get organisationUnit in the form of 
/**
 * {
 *      "organisationUnits" : [
 *                  { 
 *                      "id" : <uid> 
 *                  }
 *          ]
 * }
 */
const sourceServerUrl =  properties.get( "server.url.get.ou" );

// URL to get tracked entity instances
const sourceServerOrgUnitUrl = properties.get( "server.url.get.tei" );

// Local directory to download TEIs
const downloadDirectory = properties.get( "local.download.dir" );

// Local directory which contains data dictionary file
const dictionaryFile = properties.get( "local.data.dictionary" );

// Server username
const username=properties.get("server.credentials.username");

// Server password
const password=properties.get("server.credentials.password");

const logging = process.argv[3];
const dataDictionary = readDataDictionary();
const attributesToAnonymise = readAttributes();  //TODO to be loaded from file

// Fetch organization unit groups data with Authorization header
async function fetchData() {
    const credentials = Buffer.from(username+":"+password).toString('base64');

    try {
        const response = await fetch(sourceServerUrl, {
            headers: {
                'Authorization': `Basic ${credentials}`, // Update to Basic Auth
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            }
        });

        console.log("Fetching orgUnit request status: " +response.status);
        
        // Un comment for debuggging api request 
        //console.log(response.text());

        const data = await response.json();

        // un comment to see orgUnit data
        //console.log(data);

        // Extract organization unit IDs from the response
        const ouIds = data.organisationUnits.map(unit => unit.id);

        // Process each organization unit ID
        
        if ( fs.existsSync( downloadDirectory ) ){
            console.log(`Directory ${downloadDirectory} exits`);
        }else{
            fs.mkdir(downloadDirectory, err => {
                if(err){
                    console.error( err );
                }else{
                    if ( logEnabled() ) console.log(" directory created " );
                }
            });
        }
        
      //   console.log("Starting download for all OrganisationUnits");
         await Promise.all(ouIds.map(async ouId => {

             console.log( "Downloading data for: " + ouId );

            const teiUrl = sourceServerOrgUnitUrl.replace( '${ouId}',ouId);
            const response = await fetch( teiUrl, {
                headers: {
               //     'Authorization': `ApiToken ${apiToken}`
                    'Authorization': `Basic ${credentials}`, // Update to Basic Auth

                }   
            });

      //      console.log("Fetching trackedEntityInstances request status: " +response.status);

            const data = await response.json();
            
            // Filter attributes and regenerate payload with random names for specific attributes

            const filteredPayload = data.trackedEntityInstances.map(instance => {

                const filteredAttributes = instance.attributes.filter(attribute => {
                    return attributesToAnonymise.includes( attribute.attribute );
                }).map(attribute => {

                    var values = dataDictionary.get(attribute.attribute);
                    attribute.value = values[Math.floor(Math.random() * values.length)];
                    return attribute;
                
                });
                instance.attributes = filteredAttributes;
                return instance;
            });

            // Resulting JSON payload with filtered attributes and random names
            const regeneratedPayload = { "trackedEntityInstances": filteredPayload };

            // Convert the payload to a JSON string
            const jsonString = JSON.stringify(regeneratedPayload, null, 2);

            // Write the JSON string to a file named 'output.json' with the organization unit ID as the filename
            const filePath = path.join(downloadDirectory, `${ouId}.json`);
             fs.writeFile(filePath, jsonString, 'utf-8', err => {
                 if(err)console.error( err );
                 
                 if ( logEnabled()  )console.log(" File Written: " + filePath );
            });
        })).then( data => {
            console.log(`Data successfully downloaded at ${downloadDirectory}`);
        }).catch( error => {
            console.error( "Data download failed: " + error)
        });   
        
    } catch (error) {
        console.error(error);
    }
}

fetchData(); // Call the function to start fetching the data

function readDataDictionary() {
    var map = new Map(Object.entries(JSON.parse(fs.readFileSync(dictionaryFile).toString())));
    return map; 
}

function readAttributes() {

   var value = properties.get("server.data.attributesToAnonymize");
   return value.split(",");
}

function loadProperties(){
    const propertiesFile = process.argv[2];
    if (!fs.existsSync(propertiesFile)){
        console.error( 'file: ' + propertiesFile + ' not found');
        process.exit();
    }

    console.log('Loading properties from ' + propertiesFile );
    return new propertiesReader( propertiesFile );
}

function logEnabled(){
    if ( logging == '-d' )return true;
    return false;
}
