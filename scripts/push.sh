#!/usr/bin/env bash
VERSION=$(yarn info . version --silent)

git config user.email "noreply@mapgrid.org"
git config user.name "mapgrid"
git add package.json
git commit -m "$VERSION"
git push
git push --tags
