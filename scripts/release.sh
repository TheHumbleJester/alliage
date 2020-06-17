#!/bin/sh

version="$($(npm bin)/package-property version)"
name="$($(npm bin)/package-property name)"
repo="$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME"

$(npm bin)/version-has-changed
if [ $? -eq 0 ]; then
  cp README.md dist
  cp -R docs dist
  $(npm bin)/copy-package-file dist devDependencies scripts
  $(npm bin)/create-github-release $repo $version && echo "Release \"$version\" created on \"$repo\""
  npm publish dist && echo "\"$name@$version\" has been successfully published on NPM"
else
  echo "No need to publish package."
fi