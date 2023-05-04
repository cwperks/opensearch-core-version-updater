const core = require('@actions/core');
const tool = requre("./update-version");

const previousVersion = core.getInput('previous-version', { required: true});
const newVersion = core.getInput('new-version', { required: true});
const updateCurrent = core.getInput('update-current') === 'true';

try {
    core.log(`Intepreted parameters as; previousVersion: ${previousVersion}, newVersion: ${newVersion}, updateCurrent: ${updateCurrent}`);
    tool.updateRepositoryVersions(previousVersion, newVersion, updateCurrent);
} catch (error) {
    core.setFailed(error.message);
}
