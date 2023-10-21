
'use strict';
import fetch from 'node-fetch';
import fs  from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';


// Function to generate random names
function getRandomName() {
    const names = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Henry", "Ivy", "Jack"];
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
}
function getRandomCnic() {
    const cnic= ["1121212343212", "1235678901231", "7654890123619", "2589631475369", "9874563214569", "7852147963254", "7539513579515", "8965412365478", "I7852149634785", "7896541236541"];
    const randomIndex2 = Math.floor(Math.random() * cnic.length);
    return cnic[randomIndex2];
}

const properties = loadProperties();
const apiToken = properties.get("source.server.token");
const sourceServerUrl =  properties.get( "source.server.url" );
const sourceServerOrgUnitUrl = properties.get( "source.server.orgunit.url" );
const downloadDirectory = properties.get( "source.download.file" );
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

        if ( logEnabled() ) console.log( data );
        
        // Extract organization unit IDs from the response
        const ouIds = data.organisationUnits.map(unit => unit.id);

        // Process each organization unit ID
        
        fs.mkdir(downloadDirectory, err => {
            if(err){
                console.error( err );
            }else{
                if ( logEnabled() ) console.log(" directory created " );
            }
        });
        
         await Promise.all(ouIds.map(async ouId => {

            if ( logEnabled == '-d' ) console.log( "Downloading data from: " + ouId );

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
                        attribute.value = getRandomName();
                    } else if (attribute.attribute === "z9uj8ikQFQ2") {
                        attribute.value = getRandomCnic();
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
            await fs.writeFile(filePath, jsonString, 'utf-8', err => {
                 if(err)console.error( err );
                 
                 if ( logEnabled()  )console.log(" File Written " );
            });

            if(logEnabled())console.log(`File successfully created: ${filePath}`);
        }));   
    } catch (error) {
        console.error(error);
    }
}

fetchData(); // Call the function to start the process

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
