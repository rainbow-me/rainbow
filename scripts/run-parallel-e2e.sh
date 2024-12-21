#!/bin/bash

./node_modules/.bin/detox test ./e2e/parallel/ -c ios.sim.release --maxWorkers 2 --R 3
