#!/bin/bash
source .env

# Get the current branch name
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

# Define the regular expression for the RC branch
BRANCH_REGEX="^rc-v([0-9]+)\.([0-9]+)\.([0-9]+)$"

# Exit early if the branch name doesn't match the pattern
if [[ ! $BRANCH_NAME =~ $BRANCH_REGEX ]]; then
    echo "Error: you are not on the RC branch" >&2
    exit 1
fi

# Extract version numbers from the branch name
MAJOR=${BASH_REMATCH[1]}
MINOR=${BASH_REMATCH[2]}
PATCH=${BASH_REMATCH[3]}

# Create a tag from the version numbers (without the rc- prefix)
TAG="v$MAJOR.$MINOR.$PATCH"
echo "Creating tag $TAG"

# Create the git tag
git tag "$TAG"

# Push the tag to the remote repository
git push --tags

# Force push the current branch to master
echo "Force pushing branch $BRANCH_NAME to master"
git push origin "$BRANCH_NAME:master" --force

# Get the latest commit SHA on the master branch
COMMIT_SHA=$(git rev-parse master)

# Get the current UTC time in ISO 8601 format
DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# App name, repository, and environment (fill in the correct values)
APP_NAME="rainbow"
REPO_NAME="rainbow-me/rainbow"
ENVIRONMENT="production"

echo "Notifying Swarmia about the new release"

# Make the HTTP request to Swarmia
curl -X POST \
  https://hook.swarmia.com/deployments \
  -H "Authorization: " \
  -H "Content-Type: application/json" \
  -d '{
    "version": "'"$TAG"'",
    "appName": "'"$APP_NAME"'",
    "environment": "'"$ENVIRONMENT"'",
    "deployedAt": "'"$DEPLOYED_AT"'",
    "commitSha": "'"$COMMIT_SHA"'",
    "repositoryFullName": "'"$REPO_NAME"'"
  }'

echo "";
echo "Release created succesfully"