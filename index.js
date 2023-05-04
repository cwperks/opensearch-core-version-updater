const core = require('@actions/core');
const updateVersion = require("./update-version");

const previousVersion = core.getInput('previous-version', { required: true});
const newVersion = core.getInput('new-version', { required: true});
const updateCurrent = core.getInput('update-current') === 'true';

try {
    core.info(`Interpreted parameters as; previousVersion: ${previousVersion}, newVersion: ${newVersion}, updateCurrent: ${updateCurrent}`);
    updateVersion(previousVersion, newVersion, updateCurrent);
} catch (error) {
    core.setFailed(error.message);
}
