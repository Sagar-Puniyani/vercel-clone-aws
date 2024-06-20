const { exec } = require('child_process')
const path = require('path');
const fs = require('fs');
const {S3Client , PutObjectCommand} = require('@aws-sdk/client-s3');
const mime = require('mime-types')

const s3Client = new S3Client({
    region : 'ap-south-1',
    credentials: {
        accessKeyId: `${process.env.USER_ACCESS_KEY}`,
        secretAccessKey: `${process.env.SECRET_USER_ACCESS_KEY}`
    }
})

console.log("process : " , process.env.USER_ACCESS_KEY);

const PROJECT_ID = process.env.PROJECT_ID;


async function init(){
    console.log("Executing the script.js");
    const outDirPath = path.join(__dirname, 'output');

    const process = exec( `cd ${outDirPath} && npm install && npm run build` );
    
    process.stdout.on('data' , function (data) {
        console.log(data.toString());
    })

    process.stdout.on('error' , function (data) {
        console.log("Error : ",data.toString());
    })

    process.on('close' , async function () {
        console.log('Build Complete');
        console.log('Uploading started');
        // stream dist to s3 
        const distDirPath = path.join(__dirname, 'output' , 'dist');
        const distFolderContents = fs.readdirSync(distDirPath, {recursive: true});

        for ( const file of distFolderContents ){
            const filepath = path.join(distDirPath, file);
            if ( fs.lstatSync(filepath).isDirectory()) continue;

            console.log('uploading : ', filepath);

            const command = new PutObjectCommand({
                Bucket: `vercel-clone-outputs-dir`,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filepath),
                ContentType: mime.lookup(filepath)
            })

            await s3Client.send(command);
            console.log('uploaded : ', filepath);
        }

        console.log('Upload Done....')
    })
}

init();