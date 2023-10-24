
import https from 'follow-redirects';
import fs  from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';


const properties = loadProperties();

// Directory path where the JSON files are stored
const directoryPath = properties.get( "source.download.file" );
const apiToken = properties.get("source.server.token");


async function postData(){

        // Get a list of all JSON files in the directory
        fs.promises.readdir(directoryPath)
        .then(files => {
            // Iterate through each JSON file and send a POST request
            files.forEach(async file => {
                if (path.extname(file) === '.json') {
                    try {
                        // Read the content of the JSON file
                        const filePath = path.join(directoryPath, file);
                        const postData = await fs.promises.readFile(filePath, 'utf-8');

                        // Options for the POST request
                        const options = {
                            method: 'POST',
                            hostname: 'tracker.pakdhis2.org',
                            path: '/api/trackedEntityInstances?strategy=UPDATE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `ApiToken ${apiToken}`,
                            }
                        };

                        // Send a POST request
                        const req = https.request(options, function (res) {
                            const chunks = [];

                            res.on('data', function (chunk) {
                                chunks.push(chunk);
                            });

                            res.on('end', function () {
                                const body = Buffer.concat(chunks);
                                console.log(body.toString());
                            });

                            res.on('error', function (error) {
                                console.error(error);
                            });
                        });

                        // Write the JSON data to the request
                        req.write(postData);
                        req.end();
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

function loadProperties(){
    const propertiesFile = process.argv[2];
    if (!fs.existsSync(propertiesFile)){
        console.error( 'file: ' + propertiesFile + ' not found');
        process.exit();
    }

    console.log('Loading properties from ' + propertiesFile );
    return new propertiesReader( propertiesFile );
}