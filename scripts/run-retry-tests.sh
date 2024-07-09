#!/bin/bash

max_retries="$1"
count=0
failed_tests=""

run_tests() {
    if [ -z "$failed_tests" ]; then
        ./node_modules/.bin/detox test -c ios.sim.release --maxWorkers 2 -- --forceExit --bail 1
    else
        ./node_modules/.bin/detox test -c ios.sim.release --maxWorkers 2 -f "$failed_tests" -- --forceExit --bail 1
    fi
}

until (( count >= max_retries ))
do
    if [ $count -eq 0 ]; then
        run_tests | tee output.log
    else
        run_tests
    fi
    
    ret_val=$?
    if [ $ret_val -eq 0 ]; then
        echo "All tests passed."
        exit 0
    fi
    
    if [ $count -eq 0 ]; then
        failed_tests=$(grep -oP '(?<=at )[^ ]+\.spec\.ts(?=:)' output.log | sort -u | tr '\n' '|' | sed 's/|$//')
        rm output.log
    fi
    
    ((count++))
    echo "Test failed, attempt $count/$max_retries..."
    echo "Rerunning failed tests: $failed_tests"
done

echo "Tests failed after $max_retries attempts."
exit 1