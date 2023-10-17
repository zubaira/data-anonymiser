const https = require('follow-redirects').https;
const fs = require('fs');
const path = require('path');

// Directory path where the JSON files are stored
const directoryPath = './output/';

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
                            'Authorization': 'ApiToken d2pat_9USCM2cS2QH0HFBwDRfDZdEPLRO5OZGc2798345445',
                            'Cookie': 'JSESSIONID=B6971D2233806AD479BFC74A836663FC'
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
