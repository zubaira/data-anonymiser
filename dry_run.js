
'use strict';
import fetch from 'node-fetch';
import fs  from 'fs';
import propertiesReader from 'properties-reader';
    

const properties = loadProperties();
const apiToken = properties.get("source.server.token");
const sourceServerUrl =  properties.get( "source.server.ou.dry.url" );
const sourceServerOrgUnitUrl = properties.get( "source.server.tei.dry.url" );
const downloadedFIle = properties.get( "source.download.dry.file" );

const logging = process.argv[3];


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
            const jsonString = JSON.stringify(data, null, 2);

            fs.writeFile(downloadedFIle, jsonString, 'utf-8', err => {
                if(err)console.error( err );
                
           });  
            // Filter attributes and regenerate payload with random names for specific attributes

           
        })).then( data => {
            console.log(`Data successfully downloaded at ${downloadedFIle}`);
        }).catch( error => {
            console.error( "Data download failed" + error)
        });   
        
    } catch (error) {
        console.error(error);
    }
}

fetchData(); // Call the function to start the process


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
