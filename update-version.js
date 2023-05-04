const core = require('@actions/core');
const fs = require('fs');

class Version {
  constructor(versionString) {
    try {
        const versionParts = versionString.split('.');
        this.major = parseInt(versionParts[0], 10);
        this.minor = parseInt(versionParts[1], 10);
        this.revision = parseInt(versionParts[2], 10);
    } catch (error) {
        throw new Error(`Unable to parse version from ${versionString}, it should be in a format "1.2.3"`);
    }
  }

  toDottedString() {
    return `${this.major}.${this.minor}.${this.revision}`;
  }
  toUnderscoredString() {
    return `${this.major}_${this.minor}_${this.revision}`;
  }
  toIdString() {
    return `${this.major * 1000000 + (this.minor) * 10000 + this.revision * 100 + 99}`;
  }
}

function updateRepositoryVersions(previousVersionStr, newVersionStr, updateCurrentVersion) {
  const previousVersion = new Version(previousVersionStr);
  const newVersion = new Version(newVersionStr);

  updateVersionJava(previousVersion, newVersion, updateCurrentVersion);

  updateBwcVersion(previousVersion);
}

function updateVersionJava(previousVersion, newVersion, updateCurrentVersion) {
  core.startGroup("Updating version.java file");

  // Where Version.java need to be updated
  const versionJavaFilePaths = [
    'server/src/main/java/org/opensearch/Version.java',
    'libs/core/src/main/java/org/opensearch/Version.java',
  ];
  const versionJavaFilePath = versionJavaFilePaths.find(path => fs.existsSync(path))
    ?? (() => { throw new Error('Could not find Version.java file'); })();
  core.info(`Found version.java at ${versionJavaFilePath}`);

  // Read the contents of the Version.java file
  const versionJavaContent = fs.readFileSync(versionJavaFilePath, 'utf-8');

  // Find the previous version's lucence version for reuse in the new version
  const luceneLineRegex = new RegExp(`public static final Version V_${previousVersion.toUnderscoredString()} = new Version\\(\\d+, org\\.apache\\.lucene\\.util\\.Version\\.LUCENE_(\\d+_\\d+_\\d+)\\);`);
  const luceneLineMatches = versionJavaContent.match(luceneLineRegex);
  if (!luceneLineMatches) {
    throw new Error(`[ERROR] Unable to find previous version ${previousVersion.toDottedString()} in ${versionJavaFilePath}`);
  }

  // Construct the new version entry
  const luceneVersionString = luceneLineMatches[1];
  core.info(`Found lucence version for previous version ${previousVersion.toDottedString()} is ${luceneVersionString}`);
  const newVersionLine = `    public static final Version V_${newVersion.toUnderscoredString()} = new Version(${newVersion.toIdString()}, org.apache.lucene.util.Version.LUCENE_${luceneVersionString});`;

  // Make sure the new version doesn't already exist
  const alreadyHasNewVersion = versionJavaContent.match(new RegExp(`V_${newVersion.toUnderscoredString()}`));
  if (alreadyHasNewVersion) {
    throw new Error(`[ERROR] Unable to add version ${newVersion.toDottedString()}, was already found in ${versionJavaFilePath}`);
  }

  // Append the new version entry after the previous entry
  let newVersionJavaContent = versionJavaContent.replace(luceneLineRegex, `$&\n${newVersionLine}`);

  // Update the current version reference to the new version 
  if (updateCurrentVersion) {
    const currentVersionRegex = /public static final Version CURRENT = V_(\d+_\d+_\d+);/;
    const updatedCurrentVersion = `public static final Version CURRENT = V_${newVersion.toUnderscoredString()};`;
    newVersionJavaContent = newVersionJavaContent.replace(currentVersionRegex, updatedCurrentVersion);
  }

  // Update the file on disk
  fs.writeFileSync(versionJavaFilePath, newVersionJavaContent, 'utf-8');
  core.info(`${versionJavaFilePath} has been updated.`);
  core.endGroup();
}

function updateBwcVersion(previousVersion) {
  core.startGroup("Updating bwcVersions file");

    // Where BWC versions need to be updated
  const bwcVersionsPath = '.ci/bwcVersions';

  // Read the contents of the Version.java file
  const bwcVersionsContent = fs.readFileSync(bwcVersionsPath, 'utf-8');
  
  // Construct the new version entry
  const previousVersionForBwc = `  - "${previousVersion.toDottedString()}"`

  // Only update the BWC versions if the entry was not found 
  const alreadyHasPreviousVersionForBwc = bwcVersionsContent.match(new RegExp(escapeRegExp(previousVersionForBwc)));
  if (alreadyHasPreviousVersionForBwc) {
    core.notice(`Version ${previousVersion.toDottedString()}, was already found in ${bwcVersionsPath}`);
    core.info(`${bwcVersionsPath} is up-to-date.`);
  } else {
    fs.appendFileSync(bwcVersionsPath, previousVersionForBwc + "\r\n");
    core.info(`${bwcVersionsPath} has been updated.`);
  }
  core.endGroup();
}

// From https://stackoverflow.com/a/6969486/533057
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = updateRepositoryVersions