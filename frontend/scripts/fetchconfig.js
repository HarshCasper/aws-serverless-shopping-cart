process.env.AWS_SDK_LOAD_CONFIG = true;
var fs = require('fs');

var args = process.argv.slice(2);
var envtype = args[0] ? args[0] : ''
var AWS = require('aws-sdk');
var ssm = new AWS.SSM({
    endpoint: 'http://localhost:4566',
    accessKeyId: 'test',
    secretAccessKey: 'test',
    region: 'us-east-1',
});

const query = {
    "Path": "/serverless-shopping-cart-demo/",
    "WithDecryption": false,
    "Recursive": true
}

const requiredParams = ["CART_API_URL", "PRODUCTS_API_URL", "USER_POOL_ID",
    "USER_POOL_CLIENT_ID"
]

var params = ssm.getParametersByPath(query).promise()

var output = []

function formatParams(data) {
    for (var param of data) {
        const paramName = param.Name.toUpperCase().split("/").pop().replace(/-/g, "_")
        if (requiredParams.includes(paramName)) {
            var paramValue = param.Value
            if (paramName == "CART_API_URL" || paramName == "PRODUCTS_API_URL") {
                // Replace the "execute-api.amazonaws.com" with "execute-api.localhost.localstack.cloud"
                paramValue = paramValue.replace(/execute-api\.amazonaws\.com/, "execute-api.localhost.localstack.cloud")
            }
            output.push("VUE_APP_" + paramName + '=' + paramValue)
        }
    }
}

params
    .then(data => {
        formatParams(data.Parameters)
        output.push("VUE_APP_AWS_REGION=" + AWS.config.region)
        var fileName
        if (envtype) {
            fileName = "./.env." + envtype
        }
        else {
            fileName = "./.env"
        }
        fs.writeFile(fileName, output.join('\n'), function (err) {
            if (err) {
                return console.log(err);  // eslint-disable-line no-console
            }
            console.log(`env file ${fileName} populated with config`);  // eslint-disable-line no-console
        });

    })
    .catch(error => {
        console.log('error: ' + error)  // eslint-disable-line no-console
    })
