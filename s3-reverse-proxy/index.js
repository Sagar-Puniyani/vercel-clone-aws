const express = require('express');
const httpProxy = require('http-proxy');

const PORT=8000
const app = express();
const Base_Path = 'https://vercel-clone-outputs-dir.s3.ap-south-1.amazonaws.com/__outputs';

const proxy = httpProxy.createProxy();

app.use((req,res) =>{
    const hostname = req.hostname;
    console.log('Host name : 🧐' , hostname);
    const subdomain= hostname.split('.')[0];
    console.log('Sub Domain : 🧐' , subdomain);
    
    const resolvesTo = `${Base_Path}/${subdomain}`
    console.log('resolvesTo : 🧐' , resolvesTo);

    proxy.web(req , res , {target: resolvesTo, changeOrigin: true })
})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'

})


app.listen(PORT,()=>{
    console.log(`Reverse proxy Running ....${PORT}`);
})