const fs = require("fs");

const fetch = require("node-fetch");
const moment = require("moment");

require('dotenv').config();

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

function createCsvRow(project, title, content, date, timezone) {
    const values = [ project, title, content, "N", date, date, "", "", "0", "0", "", "0", timezone ];

    return values
        .map(el => `"${el}"`)
        .join(",");
}

function reformatTask(projects, labels, item) {
    const title = item.content;
    const project = projects[item.project_id].name;
    const content = item.notes;
    const date = item.date;

    const task = { title, project, content, date };

    if(item.labels.length) {
        const labelString = item.labels
            .map(id => labels[id].name)
            .join(" #");

        task.title += ` #${labelString}`;
    }

    return task;
}

function reformatDateForTicktick(date) {
    return moment
        .parseZone(item.date)
        .format("YYYY-MM-DDTHH:mm:ssZZ");
}

function addNotesToTask(item, notes) {
    item.notes = notes
        .filter(note => note.item_id === item.id)
        .map(note => {
            const date = reformatDateForTicktick(note.posted);
            const content = note.content;

            return `${date}:\n${content}`;
        })
        .join("\n---\n");

    return item;
}

function addDateToTask(item, reminders) {
    if(item.due_date_utc) {
        item.date = reformatDateForTicktick(item.due_date_utc);
    } else {
        item.date = reminders
            .filter(reminder => reminder.item_id === item.id)
            .map(reminder => reformatDateForTicktick(item.due_date_utc))
            .slice(-1)
            .join("");
    }

    return item;
}

const todoistToken = process.env.TODOIST_TOKEN;

getTodoistData(todoistToken)
    .then(result => {
        const projects = convertArrayToObject(result.projects, "id");
        const labels = convertArrayToObject(result.labels, "id");
        const timezone = process.env.TIMEZONE;

        const rows = result.items
            .map(item => addNotesToTask(item, result.notes))
            .map(item => addDateToTask(item, result.reminders))
            .map(item => reformatTask(projects, labels, item))
            .map(task => createCsvRow(task.project, task.title, task.content, task.date, timezone))
            .join(",\n");

        const template = fs.readFileSync("template.csv", "utf8");
        const csv = generateCsv(rows, template);

        fs.writeFileSync(`${__dirname}/${process.env.OUTPUT_FILE}`, csv);
    })
    .catch(console.error);
