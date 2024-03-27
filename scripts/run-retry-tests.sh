#!/bin/bash

max_retries=$1
count=0

until [ $count -ge $max_retries ]
do
  ./node_modules/.bin/detox test -R 5 --configuration ios.sim.release --forceExit --bail && exit 0
  count=$[$count+1]
  echo "Test failed, attempt $count/$max_retries..."
done

echo "Tests failed after $max_retries attempts."
exit 1