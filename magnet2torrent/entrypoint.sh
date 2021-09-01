#!/bin/bash

npm install

if [ -z "$CI" ]
then
    npm run test -- --watchAll
else
    # CI=true
    npm run test
fi