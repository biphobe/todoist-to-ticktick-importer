const fetch = require("node-fetch");

require('dotenv').config();

const todoistToken = process.env.TODOIST_TOKEN;

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

getTodoistData(todoistToken)
    .then(console.log)
    .catch(console.error);