const fs = require("fs");

const fetch = require("node-fetch");

require('dotenv').config();

const todoistToken = process.env.TODOIST_TOKEN;
const csvTemplate = fs.readFileSync("template.csv", "utf8");

function getTodoistData(token) {
    return fetch("https://todoist.com/api/v7/sync", {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `token=${token}&sync_token=*&resource_types=[\"all\"]`,
        method: "POST"
    })
        .then(res => res.json());
}

function generateCsv(content, template) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth()+1;
    const day = date.getDate();

    return template
        .replace("{{date}}", `${year}-${month}-${day}`)
        .replace("{{content}}", content);
}

getTodoistData(todoistToken)
    .then(console.log)
    .catch(console.error);
