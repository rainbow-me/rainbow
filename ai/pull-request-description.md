<!-- https://github.com/rainbow-me/rainbow/pull/PULL_REQUEST_NUMBER.diff -->

Browse the pull request patch url, then after browsing that link, generate a markdown summary of the major changes that were introduced in this pull request. Parse the pull request number from the github link, and save the markdown in `./prs/pr-${PULL_REQUEST_NUMBER}.md`.

Use the below template to structure the markdown.

## 1. First major change

### First Heading

- bullet point 1
- bullet point 2 (if necessary)
- ...

### Second Heading

- bullet point 1
- bullet point 2 (if necessary)
- ...

## 2. Second major change

### First Heading

- bullet point 1
- bullet point 2 (if necessary)
- ...

## 3. Third major change

### First Heading

- bullet point 1
- bullet point 2 (if necessary)
- ...

Add more changes, and bullet points as necessary per the changes parsed from the patch file.

End the markdown file with a small TLDR or gist of the changes. Example below:

This PR represents a significant refactoring of the chain badge system, moving from static assets to remote images while improving the overall architecture and maintainability of the codebase.
