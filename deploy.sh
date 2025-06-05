#!/bin/bash

# PRODUCTION
git reser --hard
git checkout master
git pull origin master

docker compose up -d