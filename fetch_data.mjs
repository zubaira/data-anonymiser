
'use strict';
import fetch from 'node-fetch';
import fs  from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';

const properties = loadProperties();
const apiToken = properties.get("source.server.token");
const sourceServerUrl =  properties.get( "source.server.url" );
const sourceServerOrgUnitUrl = properties.get( "source.server.orgunit.url" );
const downloadDirectory = properties.get( "source.download.file" );
const logging = process.argv[3];

const nameCollection = getRandomName();
const cnicCollection = getRandomCnic();

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
                    return attribute.attribute === "sB1IHYu2xQT" || attribute.attribute === "ENRjVGxVL6l"  || attribute.attribute === "z9uj8ikQFQ2";
                }).map(attribute => {
                    if (attribute.attribute === "sB1IHYu2xQT" || attribute.attribute === "ENRjVGxVL6l") {
                        attribute.value = nameCollection[Math.floor(Math.random() * nameCollection.length)];
                    } else if (attribute.attribute === "z9uj8ikQFQ2") {
                        attribute.value = cnicCollection[Math.floor(Math.random() * cnicCollection.length)];
                    }
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

function getRandomName() {
      var json = JSON.parse(fs.readFileSync('./names.json').toString());
      return json; 
}
function getRandomCnic() {
    var json = JSON.parse(fs.readFileSync('./cnic.json').toString());
    return json; 
}

function loadProperties()
{
    const propertiesFile = process.argv[2];
    if (!fs.existsSync(propertiesFile))
    {
        console.error( 'file: ' + propertiesFile + ' not found');
        process.exit();
    }

    console.log('Loading properties from ' + propertiesFile );
    return new propertiesReader( propertiesFile );
}

function logEnabled()
{
    if ( logging == '-d' )return true;

    return false;
}
