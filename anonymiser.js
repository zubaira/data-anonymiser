const https = require('node:https');

const options = {
  hostname: 'demo.pakdhis2.org',
  path : '/api/organisationUnitGroups/QSKdbtmrMj9.json',
  method: 'GET',
  headers : {
      'authorization' : 'ApiToken d2pat_qz022f7AxyA2b6uuS4RHutyDZyt6RDgF4274123802'
  }
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (data) => {
    process.stdout.write(JSON.stringify(JSON.parse(data)));
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
