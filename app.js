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

function convertArrayToObject(array, key) {
    return array
        .reduce((obj, value) => {
            obj[value[key]] = value;

            return obj;
        }, {});
}

function createCsvRow(project, title, content, reminder, timezone) {
    const values = [ project, title, content, "N", "", "", reminder, "", "0", "0", "", "0", timezone, "" ];

    return values.map(el => `"${el}"`).join(", ");
}

getTodoistData(todoistToken)
    .then(result => {
        const projects = convertArrayToObject(result.projects, "id");
        const labels = convertArrayToObject(result.labels, "id");

        result.items.forEach((task, index) => {
            if(!task.labels.length) {
                return;
            }

            const labelString = task.labels.map(id => labels[id].name).join(" #");

            task.content += ` #${labelString}`;

            result.items[index] = task;
        });
    })
    .catch(console.error);
