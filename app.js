const fetch = require("node-fetch");

require('dotenv').config();

fetch("https://todoist.com/api/v7/sync", {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `token=${process.env.TODOIST_TOKEN}&sync_token=*&resource_types=[\"all\"]`,
    method: "POST"
})
    .then(res => res.json())
    .then(console.log)
    .catch(console.error);