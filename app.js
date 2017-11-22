const fs = require("fs");

const fetch = require("node-fetch");
const moment = require("moment");

require('dotenv').config();

const timezone = process.env.TIMEZONE;
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
    const date = moment().format("YYYY-MM-DD");

    return template
        .replace("{{date}}", date)
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

function createTask(projects, labels, item) {
    const title = item.content;
    const project = projects[item.project_id].name;
    const content = item.notes;
    const reminder = item.reminder;

    const task = { title, project, content, reminder };

    if(item.length) {
        const labelString = item.labels.map(id => labels[id].name).join(" #");

        task.title += ` #${labelString}`;
    }

    return task;
}

getTodoistData(todoistToken)
    .then(result => {
        const projects = convertArrayToObject(result.projects, "id");
        const labels = convertArrayToObject(result.labels, "id");

        const tasks = result.items
            .map(item => {
                item.notes = result.notes
                    .filter(note => note.item_id === item.id)
                    .map(note => {
                        const date = moment.parseZone(note.posted).format("MM.DD.YYYY HH:mm Z");
                        const content = note.content;

                        return `${date}:\n${content}`;
                    })
                    .join("\n---\n");

                return item;
            })
            .map(item => {
                if(item.due_date_utc) {
                    item.reminder = moment.parseZone(item.due_date_utc).format();
                } else {
                    item.reminder = result.reminders
                        .filter(reminder => reminder.item_id === item.id)
                        .map(reminder => moment.parseZone(item.due_date_utc).format())
                        .slice(-1)
                        .join("");
                }

                return item;
            })
            .map(item => createTask(projects, labels, item));

        tasks.forEach(i => console.log(i));
    })
    .catch(console.error);
