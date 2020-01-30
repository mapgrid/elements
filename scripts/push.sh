#!/usr/bin/env bash
git config user.email "noreply@mapgrid.org"
git config user.name "mapgrid"
git add package.json
git commit -m "$npm_package_version"
git push
git push --tags
