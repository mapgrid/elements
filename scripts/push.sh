#!/usr/bin/env bash
VERSION=$(yarn info . version --silent)

git add package.json
git commit -m "$VERSION"
git push
git push --tags
