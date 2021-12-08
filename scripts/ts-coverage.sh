#!/bin/bash
set -eo pipefail

typescript-coverage-report -t 99 --ignore-files 'config/**/*.*' --ignore-files 'android/**/*.*' --ignore-files 'ios/**/*.*' --ignore-files 'e2e/**/*.*'  --ignore-files 'rainbow-scripts/**/*.*'  --ignore-files 'android/**/*.*'