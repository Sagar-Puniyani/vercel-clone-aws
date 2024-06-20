const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const {
    Credentialsconf,
    EcsClusterConf,
    AWSVPSconf,
} = require("./constants.js");

const app = express();
const PORT = 9000;

const ecsClient = new ECSClient({
    region: "ap-south-1",
    credentials: {
        accessKeyId: `${Credentialsconf.accessKeyId}`,
        secretAccessKey: `${Credentialsconf.secretAccessKey}`,
    },
});

app.use(express.json());

app.post("/project", async (req, res) => {
    const { gitURL , slug } = req.body;
    const projectSlug = slug ? slug : generateSlug();
    console.log("Project Slug 👀:", projectSlug);

    // spin the BuilderTask
    const command = new RunTaskCommand({
        cluster: EcsClusterConf.CLUSTER,
        taskDefinition: EcsClusterConf.TASK,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: "ENABLED",
                subnets: AWSVPSconf.SUBNETS,
                securityGroups: AWSVPSconf.SECURITY_GROUP,
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: "builder-image",
                    environment: [
                        { name: "GIT_REPOSITORY__URL", value: gitURL },
                        { name: "PROJECT_ID", value: projectSlug },
                        { name: "USER_ACCESS_KEY", value: Credentialsconf.accessKeyId },
                        {
                            name: "SECRET_USER_ACCESS_KEY",
                            value: Credentialsconf.secretAccessKey,
                        },
                    ],
                },
            ],
        },
    });

    await ecsClient.send(command);

    return res.status(200)
            .json({
                status : 'Queued',
                data: {
                    subdomain : projectSlug,
                    URL : `http://${projectSlug}.localhost:8000`
                }
            })
});

app.listen(PORT, () => {
    console.log(`Reverse proxy Running ....${PORT}`);
});
