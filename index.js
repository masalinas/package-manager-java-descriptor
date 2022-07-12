const commandLineArgs = require('command-line-args');
const shell = require('shelljs');
const fs = require('fs');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// create a new progress bar instance and use shades_classic theme
const bar = new cliProgress.SingleBar({
    format: 'Descriptor Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

// congigure csv createCsvWriter
const csvWriter = createCsvWriter({
    path: 'simulator.csv',
    header: [
        {id: 'name', title: 'name'},
        {id: 'version', title: 'version'},
        {id: 'description', title: 'description'},
        {id: 'license', title: 'license'}
    ]
});

// intialize deep dependencies number
let dependencyCount = 0;
let dependencies = [];

// dependency recursive counter and descriptor
function dependencyCounter(data) {
    let selector;
    let package;
    let packageItems;

    data.split(/\r?\n/).forEach(line =>  {
        selector = line.substring(0, 10);

        if (selector === '[INFO]    ') {
            package = line.substring(10);
            packageItems = package.split(':');

            if (packageItems[2] !== 'pom') {
                dependencyCount = dependencyCount + 1;

                dependencies.push({
                    name: packageItems[1],
                    version: packageItems[3],
                    description: null,
                    license: null,
                    maintainers: null
                });
            }
        }
    });
}

try {
    let result = fs.readFileSync('dependencies.txt', 'utf8');

    dependencyCounter(result);

    // calculate deep dependencies and start progress bar
    dependencyCounter(result);

    bar.start(dependencyCount, 0);

    // stop progress bar
    bar.stop();

    console.log(dependencies);

    // remove dependencies duplicated
    const filteredDependencies = dependencies.reduce((acc, current) => {
    const x = acc.find(item => item.name === current.name);
    if (!x) {
        return acc.concat([current]);
    } else {
        return acc;
    }
    }, []);

    // export csv file from filtered dependencies
    csvWriter.writeRecords(filteredDependencies)
    .then(() => {
        console.log('... CSV Exported correctly');
    });
} catch (err) {
console.error(err);
}