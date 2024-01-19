# opensearch-core-version-updater
Github action to increment versioning for the OpenSearch repository - automates post release activity of bumping up semantic versioning for backward-compatibility.

```yaml
inputs:
  previous-version:
    description: The previous version of OpenSearch that is being replace with this new version, e.g. "2.2.2"
    required: true
  new-version:
    description: The new version of OpenSearch that is being added, e.g. "2.3.0"
    required: true
  update-current:
    description: If the current version should be replace with the new version
    required: false
```

## Usage:

```yaml
on:
  workflow_dispatch:
...
steps:
- uses: peternied/opensearch-core-version-updater@v1
  with:
    previous-version: '2.2.2'
    new-version: '2.3'
    update-current: false
```

# Changelog

## v1
- Initial Release
