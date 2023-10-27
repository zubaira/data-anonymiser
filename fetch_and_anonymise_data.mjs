
'use strict';
import fetch from 'node-fetch';
import fs  from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';

const properties = loadProperties();
const apiToken = properties.get("source.server.token");
const sourceServerUrl =  properties.get( "source.server.ou.url" );
const sourceServerOrgUnitUrl = properties.get( "source.server.tei.url" );
const downloadDirectory = properties.get( "source.download.dir" );
const dictionaryFile = properties.get( "source.server.dictionary" );
const logging = process.argv[3];
const dataDictionary = readDataDictionary();
const attributesToAnonymise = readAttributes();  //TODO to be loaded from file

// Fetch organization unit groups data with Authorization header
async function fetchData() {

    try {
        const response = await fetch(sourceServerUrl, {
            headers: {
                'Authorization': `ApiToken ${apiToken}`
            }
        });
        const data = await response.json();

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
        
         console.log("Starting download for all OrganisationUnits");
         await Promise.all(ouIds.map(async ouId => {

            if ( logEnabled() ) console.log( "Downloading data for: " + ouId );

            const teiUrl = sourceServerOrgUnitUrl.replace( '${ouId}',ouId);
            const response = await fetch( teiUrl, {
                headers: {
                    'Authorization': `ApiToken ${apiToken}`
                }   
            });

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
            console.error( "Data download failed" + error)
        });   
        
    } catch (error) {
        console.error(error);
    }
}

fetchData(); // Call the function to start the process

function readDataDictionary() {

    var map = new Map(Object.entries(JSON.parse(fs.readFileSync(dictionaryFile).toString())));

    return map; 
}

function readAttributes() {

   var value = properties.get("source.server.attributes");
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
