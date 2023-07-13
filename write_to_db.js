const { MongoClient } = require('mongodb');
const fs = require('fs');

const client = new MongoClient("mongodb://127.0.0.1:27017");

const n_section = '2077';
const dir = 'data_json/' + n_section;

async function run() {
    try {
        // Подключаемся к серверу
        await client.connect();
        console.log("Подключение к БД установлено");
        const db = client.db("rutracker");
        const collection_sections = db.collection("sections");
        const collection_subsections = db.collection("subsections");
        const collection_subsubsections = db.collection("subsubsections");
        const collection_topics = db.collection("topics_" + n_section);

        console.log("Запись в БД sections");
        if (await collection_sections.countDocuments())
            await collection_sections.drop();
        await collection_sections.insertMany(JSON.parse(fs.readFileSync('data_json/sections.json')));
        console.log('section записано в БД');


        console.log("Запись в БД subsections");
        if (await collection_subsections.countDocuments())
            await collection_subsections.drop();
        await collection_subsections.insertMany(JSON.parse(fs.readFileSync('data_json/subsections.json')));
        console.log('subsection записано в БД');

        console.log("Запись в БД subsubsections");
        if (await collection_subsubsections.countDocuments())
            await collection_subsubsections.drop();
        await collection_subsubsections.insertMany(JSON.parse(fs.readFileSync('data_json/subsubsections.json')));
        console.log('subsubsection записано в БД');


        console.log("Запись в БД topics_" + n_section);
        let topics_files = fs.readdirSync(dir);
        let data_topics = new Array();
        for (file of topics_files)
            data_topics.push(JSON.parse(fs.readFileSync(dir + '/' + file)));
        if (await collection_topics.countDocuments())
            await collection_sections.drop();
        await collection_topics.insertMany(data_topics);
        console.log('topics_' + n_section + ' записано в БД');

        client.close();
        console.log("Подключение к БД закрыто");

    } catch (err) {
        console.log(err);
    } finally {

    }
}
run().catch(console.log);
