const fs = require('fs');
const p = require('path');

let ignoreStrings = ['......', '....', '..', '...', '...!', '...?', '...!?', '...!!', '...??', '...!!!', '...???', '???', '????', '??????', 'untitled', 'OG', 'UG 2'
    , 'UG', 'Lachsen', 'The Four Visionaries', 'GFluegel', 'xDragon', 'R.D.', 'STATIC-LANG-FILE', 'sc.gimmick', 'sc.map-content', 'sc.gui'];

fs.writeFileSync('report.txt', '');
let stats = {total:0,translated:0}
progressReport('translation\\assets', stats)
fs.writeFileSync('report.txt', '\n TOTAL', {flag: 'a'});
writeStatsToReport(stats)

function progressReport(path, totalStats) {
    writeDirToReport(path);
    let files = fs.readdirSync(path)
    for (let file of files) {
        let filePath = p.join(path, file);
        if(fs.lstatSync(filePath).isDirectory()) {
            console.log(`Dir ${filePath}`);
            progressReport(filePath, totalStats);
        } else {
            if(filePath.endsWith(".json")) {
                writeDirToReport(filePath);
                let stats = {total:0,translated:0}
                fileReport(JSON.parse(fs.readFileSync(filePath)), stats)
                writeStatsToReport(stats)
                totalStats.total+=stats.total
                totalStats.translated+=stats.translated
            }
        }
    }
}

function fileReport(translation, stats) {
    if(typeof translation === 'object' && translation !== null) {
        if (Array.isArray(translation)) {
            for (let i = 0; i < translation.length; i++) {
                fileReport(translation[i], stats);
            }
        } else {
            if(translation.hasOwnProperty("transl")) {
                if(!ignoreStrings.includes(translation.orig)) { // ignore untranslatable strings
                    stats.total++;
                    if(translation.transl.toString().match(/[а-яА-ЯіїґІЇҐєЄ]/)?.length > 0) {
                        stats.translated++;
                    }
                }
            } else if(translation.hasOwnProperty("person") && translation.hasOwnProperty("expression")) {
                // dialog details, skip
                return;
            } else {
                for(k in translation) {
                    fileReport(translation[k], stats)
                }
            }
        }
    } else if(typeof translation === 'string'){
        if(!ignoreStrings.includes(translation)) {
            stats.total++;
            if([...translation.toString().matchAll(/[а-яА-ЯіїґІЇҐєЄ]/g)].length > 0) {
                stats.translated++;
            } else {
                console.log(`Not translated ${translation}`)
            }
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
        result = ` : ${stats.translated}/${stats.total} ✅`;
    } else  {
        result = ` : ${stats.translated}/${stats.total} 🔄`;
    }
    fs.writeFileSync('report.txt', result, {flag:"a"});
}

