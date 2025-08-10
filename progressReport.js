const fs = require('fs');
const p = require('path');

let ignoreStrings = ['untitled', 'OG', 'UG 2', 'UG', 'Lachsen', 'The Four Visionaries', 'GFluegel', 'xDragon',
    'R.D.', 'STATIC-LANG-FILE', 'sc.gimmick', 'sc.map-content', 'sc.gui',
    'SP', 'player.hasAnyToggleItems', '!!min=64', '!!min=66', '!!min=-1', '!!min=82', '\\i[gamepad-r1] / \\i[gamepad-r2]', '\\i[gamepad-r2] / \\i[gamepad-r1]'];

let excluded = new Set();
fs.writeFileSync('report.txt', '');
let stats = {total:0,translated:0,words:0,wordsTranslated:0}
progressReport('translation', stats)
fs.writeFileSync('report.txt', '\n TOTAL', {flag: 'a'});
writeStatsToReport(stats)

console.log("Excluded strings:")
excluded.forEach((item) => {console.log(item);});

function progressReport(path, totalStats) {
    writeDirToReport(path);
    let files = fs.readdirSync(path)
    for (let file of files) {
        let filePath = p.join(path, file);
        if(fs.lstatSync(filePath).isDirectory()) {
            console.log(`Dir ${filePath}`);
            progressReport(filePath, totalStats);
        } else {
            if(filePath.endsWith(".json") && !filePath.match(/en_US|ja_JP|ko_KR|zh_CN|zh_TW/)) {
                writeDirToReport(filePath);
                let stats = {total:0,translated:0,words:0,wordsTranslated:0}
                collectStats(JSON.parse(fs.readFileSync(filePath)), stats)
                writeStatsToReport(stats)
                totalStats.total+=stats.total
                totalStats.words+=stats.words
                totalStats.translated+=stats.translated
                totalStats.wordsTranslated+=stats.wordsTranslated
            }
        }
    }
}

function collectStats(json, stats) {
    if(typeof json === 'object' && json !== null) {
        if (Array.isArray(json)) {
            for (let i = 0; i < json.length; i++) {
                collectStats(json[i], stats);
            }
        } else {
            if(json.hasOwnProperty("transl")) {
                if(!ignoreStrings.includes(json.orig) && json.orig.toString().match(/[a-zA-Z]/)?.length > 0) { // ignore untranslatable strings
                    let words = json.orig.split(" ").filter(w => w.length > 1).length;
                    stats.words += words;
                    stats.total++;
                    if(json.transl.toString().match(/[а-яА-ЯіїґІЇҐєЄ]/)?.length > 0) {
                        stats.translated++;
                        stats.wordsTranslated += words;
                    }
                } else {
                    excluded.add(json.orig.toString());
                }
            } else if(json.hasOwnProperty("person") && json.hasOwnProperty("expression")) {
                // dialog details, skip
                return;
            } else {
                for(k in json) {
                    collectStats(json[k], stats)
                }
            }
        }
    } else if(typeof json === 'string'){
        if(!ignoreStrings.includes(json) && json.toString().match(/[a-zA-Zа-яА-ЯіїґІЇҐєЄ]/)?.length > 0) {
            stats.total++;
            if([...json.toString().matchAll(/[а-яА-ЯіїґІЇҐєЄ]/g)].length > 0) {
                stats.translated++;
            } else {
                console.log(`Not translated ${json}`)
            }
        } else {
            excluded.add(json.toString());
        }
    }
}

function writeDirToReport(path) {
    let segments = path.split('\\');
    let depth = segments.length;
    let dirName = segments[segments.length - 1];
    fs.writeFileSync('report.txt', '\n'.padEnd(depth*2-3).concat(dirName), {flag:"a"});
}

function writeStatsToReport(stats) {
    let result;
    if(stats.total == stats.translated) {
        result = ` : ${stats.total} (${stats.words}) ✅`;
    } else  {
        result = ` : ${stats.translated}/${stats.total} (${stats.wordsTranslated}/${stats.words}) 🔄`;
    }
    fs.writeFileSync('report.txt', result, {flag:"a"});
}

