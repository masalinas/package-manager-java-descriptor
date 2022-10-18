const commandLineArgs = require('command-line-args');
const shell = require('shelljs');
const fs = require('fs');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const pomParser = require("pom-parser");
const homedir = require('os').homedir();
const path = require('path')

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
    let artifact;
    let packageItems;
    let subFolders;
    let pomPath;

    let groupId;
    let artifactId;
    let version;
    let package;

    //(async function() {
        data.split(/\r?\n/).forEach(line =>  {
            selector = line.substring(0, 10);

            if (selector === '[INFO]    ') {
                artifact = line.substring(10);
                artifactItems = artifact.split(':');

                groupId = artifactItems[0];
                artifactId = artifactItems[1];
                package = artifactItems[2];
                version = artifactItems[3];

                if (package !== 'pom') {
                    dependencyCount = dependencyCount + 1;

                    // build pom file
                    subFolders = groupId.split('.');
                    pomPath = path.join(homedir, '.m2', 'repository');
                    subFolders.forEach(subFolder => {
                        pomPath = path.join(pomPath, subFolder);
                    });

                    pomPath = path.join(pomPath, artifactId, version, artifactId + '-' + version + '.pom');

                    (async function() {
                        // parse pom file
                        await pomParser.parse({filePath: pomPath}, function(err, pomResponse) {
                            if (err) {
                                console.log("ERROR: " + err);
                                process.exit(1);
                            }
                    
                            console.log(pomResponse.pomObject.project.description);
                    
                            dependencies.push({
                                name: artifactItems[1],
                                version: artifactItems[3],
                                description: pomResponse.pomObject.project.description,
                                license: null,
                                maintainers: null
                            });
                        });
                    })();

                    /*dependencies.push({
                        name: artifactItems[1],
                        version: artifactItems[3],
                        description: null,
                        license: null,
                        maintainers: null
                    });*/
                }
            }
        });
    //})()
}

try {
    let result = fs.readFileSync('dependencies.txt', 'utf8');

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