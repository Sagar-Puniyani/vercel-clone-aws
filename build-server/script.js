const { exec } = require('child_process')
const path = require('path');
const fs = require('fs');
const {S3Client , PutObjectCommand} = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const Redis = require('ioredis');
const {Reddisconf} = require('./constants.js');


const publisher = new Redis(`${Reddisconf.RedisConnection}`);

const s3Client = new S3Client({
    region : 'ap-south-1',
    credentials: {
        accessKeyId: `${process.env.USER_ACCESS_KEY}`,
        secretAccessKey: `${process.env.SECRET_USER_ACCESS_KEY}`
    }
})

console.log("process : " , process.env.USER_ACCESS_KEY);

const PROJECT_ID = process.env.PROJECT_ID;

function publishLog(log){
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

async function init(){
    console.log("Executing the script.js");
    publishLog('Build Started....');
    const outDirPath = path.join(__dirname, 'output');

    const process = exec( `cd ${outDirPath} && npm install && npm run build` );
    
    process.stdout.on('data' , function (data) {
        console.log(data.toString());
        publishLog(data.toString());
    })

    process.stdout.on('error' , function (data) {
        console.log("Error : ",data.toString());
        publishLog(`Error : ,${data.toString()}`);
    })

    process.on('close' , async function () {
        console.log('Build Complete');
        console.log('Uploading started');
        publishLog('Build Complete');
        // stream dist to s3 
        const distDirPath = path.join(__dirname, 'output' , 'dist');
        const distFolderContents = fs.readdirSync(distDirPath, {recursive: true});

        publishLog('Uploading started');
        for ( const file of distFolderContents ){
            const filepath = path.join(distDirPath, file);
            if ( fs.lstatSync(filepath).isDirectory()) continue;
            
            console.log('uploading : ', filepath);
            publishLog(`uploading : ', ${file}`);
            
            const command = new PutObjectCommand({
                Bucket: `vercel-clone-outputs-dir`,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filepath),
                ContentType: mime.lookup(filepath)
            })
            
            await s3Client.send(command);
            publishLog(`uploaded : ', ${file}`);
            console.log('uploaded : ', filepath);
        }
        publishLog(`Upload Done....`);
        console.log('Upload Done....');
        process.exit(0);
    })
}

init();