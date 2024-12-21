#!/bin/bash

./node_modules/.bin/detox test ./e2e/serial/ -c ios.sim.release --maxWorkers 1 --R 3

