# asl-tab-api

Get a YouTube channel's video data to use in the [ASL Tab browser extension](https://github.com/missmatsuko/asl-tab).

## Instructions

```
# 1. Install packages from `package-lock.json`.
npm ci

# 2. Copy `.env.example` file to `.env` file.
cp .env.example .env

# 3. Manually update `.env` contents
# Key names are pretty self-explanatory
# Currently this project is only built to pull data from a single YouTube playlist

# 4. Run local build and upload
# Note: The more items there are in the playlist, the longer this will take.
# Note: Currently, this will always upload a file named `data.json`.
# This can be edited in `index.js`.
npm start

# 5. Create dist.zip for manual upload to an AWS Lambda function.
npm run package
```
