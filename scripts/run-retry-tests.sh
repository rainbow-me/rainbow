#!/bin/bash

max_retries="$1"
count=0

until (( count >= max_retries ))
do
  ./node_modules/.bin/detox test -c ios.sim.release --maxWorkers 2 -- --forceExit --bail 1
  ret_val=$?
  if [ $ret_val -eq 0 ]; then
    exit 0
  fi
  ((count++))
  echo "Test failed, attempt $count/$max_retries..."
done

echo "Tests failed after $max_retries attempts."
exit 1
