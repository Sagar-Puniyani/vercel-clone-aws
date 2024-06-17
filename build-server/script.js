import exec from "child-process";
import path from 'path';
import fs from 'fs';
import {S3Client , PutObjectCommand} from '@aws-sdk/client-s3';
import mime from 'mime-types'

const s3Client = new S3Client({
    region : 'ap-south-1',
    credentials: {
        accessKeyId: `${process.env.USER_ACCESS_KEY}`,
        secretAccessKey: `${process.env.SECRET_USER_ACCESS_KEY}`
    }
})

const PROJECT_ID = process.env.PROJECT_ID;


async function init(){
    console.log("Executing the script.js");
    const outDirPath = path.join(__dirname, 'output');

    const process = exec(cd `${outDirPath} && npm install && npm run build` );
    
    process.stdout.on('data' , function (data) {
        console.log(data.toString());
    })

    process.stdout.on('error' , function (data) {
        console.log("Error : ",data.toString());
    })

    process.on('close' , async function () {
        console.log('Build Complete');
        // stream dist to s3 
        const distDirPath = path.join(__dirname, 'output' , 'dist');
        const distFolderContents = fs.readdirSync(distDirPath, {recursive: true});

        for ( const filepath of distFolderContents ){
            if ( fs.lstatSync(filepath).isDirectory) continue;

            console.log('uploading : ', filepath);

            const command = new PutObjectCommand({
                Bucket: `${process.env.BUCKET_NAME}`,
                Key: `__outputs/${PROJECT_ID}/${filepath}`,
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