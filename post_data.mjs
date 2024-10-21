
import https from 'https';
import fs  from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';
import fetch from 'node-fetch';



const properties = loadProperties();

// Directory path where the JSON files are stored
const directoryPath = properties.get( "local.download.dir" );

// URL to post tracked entity instances
const targetTeiUrl= properties.get("server.url.tei.post");

// Server username
const targetServerUsername = properties.get("server.credentials.username");

// Server password
const targetServerPassword = properties.get("server.credentials.password");


async function postData(){

        // Get a list of all JSON files in the directory
        fs.promises.readdir(directoryPath)
        .then(files => {
            // Iterate through each JSON file and send a POST request
            files.forEach(async file => {
                if (path.extname(file) === '.json') {
                    try {
                        // Read the content of the JSON file
                        console.log("reading: " + file);
                        const filePath = path.join(directoryPath, file);

                        console.log("reading filePath: " + filePath);
                        const postData = await fs.promises.readFile(filePath, 'utf-8');
                        const credentials = Buffer.from(targetServerUsername+":"+targetServerPassword).toString('base64');
                        
            
                            fetch(targetTeiUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Basic ${credentials}`, // Update to Basic Auth

                                },
                                body: postData
                            })
                            .then(response => {
                                console.log(response.status);
                                response.json();
                            })
                            .then(data => {
                               // un comment this to see web api response data
                                // console.log('Response:', data);
                            })
                            .catch(error => {
                                console.error('Error:', error);
                            });


                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error reading directory:', error);
        });
 }

 postData(); // Call the function to start posting the data

function loadProperties(){
    const propertiesFile = process.argv[2];
    if (!fs.existsSync(propertiesFile)){
        console.error( 'file: ' + propertiesFile + ' not found');
        process.exit();
    }

    console.log('Loading properties from ' + propertiesFile );
    return new propertiesReader( propertiesFile );
}