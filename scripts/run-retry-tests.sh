#!/bin/bash

max_retries="$1"
count=0

until (( count >= max_retries ))
do
    if [ $count -eq 0 ]; then
        ./node_modules/.bin/detox test -c ios.sim.release --maxWorkers 2 -- --forceExit
    else
        ./node_modules/.bin/detox test -c ios.sim.release --maxWorkers 2 -- --forceExit --onlyFailures
    fi
    
    ret_val=$?
    if [ $ret_val -eq 0 ]; then
        echo "All tests passed."
        exit 0
    fi
    
    ((count++))
    echo "Some tests failed, attempt $count/$max_retries..."
done

echo "Tests failed after $max_retries attempts."
exit 1