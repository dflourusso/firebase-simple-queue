#!/bin/sh
set -e

version=${1:-patch}
git up
gulp
git add dist
git commit -m 'release' | true
npm version $version
git push -v --progress
git push --tags
npm publish