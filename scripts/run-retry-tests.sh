#!/bin/bash

max_retries="$1"
count=0
failed_specs=""

run_tests() {
    if [ -z "$failed_specs" ]; then
        ./node_modules/.bin/detox test -c ios.sim.release --cleanup --maxWorkers 2 -- --forceExit
    else
        ./node_modules/.bin/detox test -c ios.sim.release --cleanup --maxWorkers 2 -f "$failed_specs" -- --forceExit
    fi
}

until (( count >= max_retries ))
do
    run_tests | tee output.log
    ret_val=${PIPESTATUS[0]}

    if [ $ret_val -eq 0 ]; then
        echo "All tests passed."
        exit 0
    fi

    # Update failed_specs based on Jest output
    failed_specs=$(grep "FAIL" output.log | grep -oE "e2e/.*\.spec\.[jt]s" | sort -u | tr '\n' ' ')

    ((count++))
    if [ $count -lt $max_retries ]; then
        echo "Some tests failed. Retrying failed tests (Attempt $count/$max_retries)..."
        echo "Failed specs: $failed_specs"
    fi
done

echo "Tests failed after $max_retries attempts."
echo "Failed specs: $failed_specs"
exit 1