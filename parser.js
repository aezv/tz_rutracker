const puppeteer = require('puppeteer');
const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp.sync('data_json');

async function get_sections() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    //*авторизация
    let login = 'project13';
    let password = 'RUTRACKERzv070720';

    console.log('Авторизация пользователя:');
    console.log('Логин: ' + login);
    console.log('Пароль: ' + password);
    await page.goto('https://rutracker.org/forum/login.php');
    await page.focus('#login-form-full > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > input[type=text]');
    await page.keyboard.type('project13');
    await page.focus('#login-form-full > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(2) > td:nth-child(2) > input[type=password]');
    await page.keyboard.type('RUTRACKERzv070720');
    await page.click('#login-form-full > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(4) > td > input');
    console.log('Авторизация пройдена');

    //*парсинг трекера
    console.log('Сбор данных с трекера');
    await page.goto('https://rutracker.org/forum/tracker.php');
    //** данные о разделах
    let data = await page.evaluate(() => {
        let main_block = document.getElementById('fs-main');
        let result = new Array();
        for (const child of main_block.children) {
            //получение имени раздела
            let section = child.label;
            //получение подразделов
            let last_subsection;
            let subsection = new Array();
            let subsubsection = new Array();
            let is_sss = false;
            for (const subchild of child.children) {
                let sublink = subchild.value;
                if (subchild.textContent.includes('|-')) {
                    is_sss = true;
                    subsubsection.push({ name: subchild.textContent, link: sublink });
                }
                else if (is_sss) {
                    if (subsubsection.length) {
                        subsection.push({ subsection: last_subsection, subsubsections: subsubsection });
                        subsubsection = new Array();
                    }
                    else
                        subsection.push({ subsection: last_subsection });
                    last_subsection = { name: subchild.textContent, link: sublink };
                    is_sss = false;
                }
                else
                    last_subsection = { name: subchild.textContent, link: sublink };
            }
            if (subsubsection.length) {
                subsection.push({ subsection: last_subsection, subsubsection: subsubsection });
                subsubsection = new Array();
            }
            else
                subsection.push({ subsection: last_subsection });

            result.push({ section: section, subsections: subsection });
        }
        return result;
    });
    await browser.close();

    console.log('Фильтрация данных трекера');
    let sections = new Array();
    let subsections = new Array();
    let subsubsections = new Array();
    for (let i = 1; i < data.length; i++) { //i=1 отсекаем "все имеющиеся"
        sections.push({ section_name: data[i].section });
        for (let j = 0; j < data[i].subsections.length; j++) {
            if (data[i].subsections[j].subsection) {
                subsections.push({
                    section_name: data[i].section,
                    name_subsection: data[i].subsections[j].subsection.name,
                    link: data[i].subsections[j].subsection.link
                });
                if (data[i].subsections[j].subsubsection) {
                    for (let g = 0; g < data[i].subsections[j].subsubsection.length; g++) {
                        subsubsections.push({
                            subsection_name: data[i].subsections[j].subsection.name,
                            name_subsubsection: data[i].subsections[j].subsubsection[g].name,
                            link: data[i].subsections[j].subsubsection[g].link
                        });
                    }
                }
            }
            else {
                if (data[i].subsections[j].subsubsection) {
                    for (let g = 0; g < data[i].subsections[j].subsubsection.length; g++) {
                        subsections.push({
                            section_name: data[i].section,
                            name_subsection: data[i].subsections[j].subsubsection[g].name,
                            link: data[i].subsections[j].subsubsection[g].link
                        });
                    }
                }
            }
        }
    }
    fs.writeFileSync('data_json/sections.json', JSON.stringify(sections));
    fs.writeFileSync('data_json/subsections.json', JSON.stringify(subsections));
    fs.writeFileSync('data_json/subsubsections.json', JSON.stringify(subsubsections));
}

async function get_topics(url) {
    let path_section = 'data_json/' + url;
    mkdirp.sync(path_section);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    //*авторизация
    let login = 'project13';
    let password = 'RUTRACKERzv070720';

    console.log('Авторизация пользователя:');
    console.log('Логин: ' + login);
    console.log('Пароль: ' + password);
    await page.goto('https://rutracker.org/forum/login.php');
    await page.focus('#login-form-full > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > input[type=text]');
    await page.keyboard.type('project13');
    await page.focus('#login-form-full > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(2) > td:nth-child(2) > input[type=password]');
    await page.keyboard.type('RUTRACKERzv070720');
    await page.click('#login-form-full > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(4) > td > input');
    console.log('Авторизация пройдена');

    console.log('********************');
    console.log('Раздел ' + url);
    await page.goto('https://rutracker.org/forum/tracker.php?f=' + url);
    let page_links = await page.evaluate(() => {
        let data_page_links = new Array();
        let pages = document.getElementsByClassName('bottom_info')[0].getElementsByClassName('pg');
        for (let elem of pages)
            data_page_links.push(elem.getAttribute('href'));
        return data_page_links;
    });

    console.log('********************');
    console.log('Получение списка топиков');
    let topics_links = new Array();
    for (let ipage = 0; ipage < page_links.length; ipage++) {
        if (ipage != 0)
            await page.goto('https://rutracker.org/forum/' + page_links[ipage]);
        let data_link = await page.evaluate(() => {
            let main_block = document.querySelector('#tor-tbl > tbody').children;
            let data_topics_link = new Array();
            for (const child of main_block) {
                let topic_link = child.querySelector('td.row4.med.tLeft.t-title-col.tt > div.wbr.t-title > a').getAttribute('href');
                data_topics_link.push(topic_link);
            }
            return data_topics_link;
        });
        for (const link of data_link)
            topics_links.push(link);
    }
    console.log('Получено топиков: ' + topics_links.length);

    console.log('********************');
    console.log('Запущен процесс парсинга топиков');
    let counter = 1;
    for (const link of topics_links) {
        let start_time = new Date();
        console.log('********************');
        console.log('Парсинг топика ' + link.slice(link.search('=') + 1));
        await page.goBack();
        //await new Promise(resolve => setTimeout(resolve, 1000));
        await page.goto('https://rutracker.org/forum/' + link);
        //await new Promise(resolve => setTimeout(resolve, 1000));
        let hidden_elems = await page.evaluate(() => {
            let data_hidden_elems = document.getElementsByClassName('sp-head.folded');
            for(const elem of data_hidden_elems)
                elem.click();
            return 0;
        });
        await page.click('#thx-block > div.sp-wrap > div.sp-head.folded.sp-no-auto-open');
        await new Promise(resolve => setTimeout(resolve, 500));
        let data_topic = await page.evaluate(() => {
            let name = document.querySelector("#topic-title").textContent;
            let date = document.getElementsByClassName('post-time')[0].querySelector('a').textContent;
            let author = document.getElementsByClassName('nick')[0].textContent;
            let description = document.getElementsByClassName('post_body')[0].textContent;
            let magnet_link = document.getElementsByClassName('magnet-link')[0].getAttribute('href');
            let torrent_link = document.getElementsByClassName('dl-link')[0].getAttribute('href');
            let thanked_list = new Array();
            if (document.querySelector("#thx-list").getElementsByTagName('U').length) {
                for (const child of document.querySelector("#thx-list").children) {
                    let thanked = {
                        id: null,
                        name: null,
                        data: null
                    };
                    if (child.tagName == 'A') {
                        thanked.id = child.querySelector("b > u").textContent;
                        thanked.data = child.querySelector("b > i").textContent;
                        thanked.name = child.textContent.slice(thanked.id.length, child.textContent.length - thanked.data.length);
                    }
                    else {
                        thanked.id = '0';
                        thanked.name = 'Гость';
                        thanked.data = child.querySelector('i').textContent;
                    }
                    thanked_list.push(thanked);
                }
            }
            else {
                thanked_list = new Array();
            }
            return {
                name: name,
                date: date,
                author: author,
                description: description,
                magnet_link: magnet_link,
                torrent_link: torrent_link,
                thanked_list: thanked_list
            };
        });
        let topic = {
            link: link.slice(link.search('=') + 1),
            name: data_topic.name,
            date: data_topic.date,
            author: data_topic.author,
            description: data_topic.description,
            magnet_link: data_topic.magnet_link,
            torrent_link: data_topic.torrent_link,
            thanked_list: data_topic.thanked_list
        };
        fs.writeFileSync(path_section + '/' + topic.link + '.json', JSON.stringify(topic));
        console.log('Пройдено топиков: ' + counter + ' из ' + topics_links.length);
        counter++;
        console.log('Топик ' + topic.link + ' собран и записан');
        console.log('Время: ' + ((new Date() - start_time) / 1000) + 'с');
    }
    console.log('********************');
    console.log('Процесс парсинга топиков завершен');
    await browser.close();
}

//2077
if (process.argv[2] == '--sections')
    get_sections();
else if (process.argv[2] == '--topics' && process.argv[3])
    get_topics(process.argv[3]);
else
    console.log(process.argv);

module.exports.get_sections = get_sections;
