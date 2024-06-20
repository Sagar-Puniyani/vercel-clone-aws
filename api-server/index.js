const express = require('express');
const  { generateSlug } = require("random-word-slugs");
const {ECSClient, RunTaskCommand} = require('@aws-sdk/client-ecs');

const app = express();
const PORT = 9000;

app.use(express.json());

app.post('/project' , (req , res )=>{
    const projectSlug = generateSlug();
    console.log('Project Slug 👀:' , projectSlug);
})


app.listen(PORT,()=>{
    console.log(`Reverse proxy Running ....${PORT}`);
})