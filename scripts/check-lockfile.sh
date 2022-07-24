git diff yarn.lock
if ! git diff --exit-code yarn.lock; then
    echo "Changes were detected in yarn.lock file after running 'yarn install', which is not expected. Please run 'yarn install' locally and commit the changes.";
    exit 1;
fi
