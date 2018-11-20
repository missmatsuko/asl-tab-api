/*
* index.js
* This file is the main js file. It gets all the video data from a YouTube channel specified in .env and uploads it to Amazon S3 as a JSON file.
*/

// Get env variables
try {
  require('dotenv').config();
} catch (error) {
}

import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import composeQueryParamUrl from './src/composeQueryParamUrl';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

// Fetch data from YouTube
async function getData(pageToken = undefined) {
  const params = {
    playlistId: YOUTUBE_PLAYLIST_ID,
    key: YOUTUBE_API_KEY,
    maxResults: 50, // 50 is the max allowed by YouTube API: https://developers.google.com/youtube/v3/docs/playlistItems/list#maxResults
    part: 'snippet',
  };

  // Add params that could be empty
  // YouTube API will not return results if there's a null or undefined param
  if (pageToken) {
    params.pageToken = pageToken;
  }

  const response = await fetch(
    composeQueryParamUrl('https://www.googleapis.com/youtube/v3/playlistItems', params)
  );

  return await response.json();
}

// Create array of video info
async function getVideos() {
  const videos = [];
  let pageToken = undefined;

  while (true) {
    const data = await getData(pageToken);

    if (data.items.length) {
      videos.push(...data.items);
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return videos;
}

// Upload result as JSON file to Amazon S3
export default async function uploadToS3() {
  const result = await getVideos();

  const awsS3Params = {
    apiVersion: '2006-03-01',
    region: process.env.AWS_REGION,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  }

  const s3 = new AWS.S3(awsS3Params);

  const objectParams = {
    ACL: 'public-read',
    Body: JSON.stringify(result),
    Bucket: process.env.AWS_BUCKET_NAME,
    ContentType: 'application/json',
    Key: 'data.json',
  }

  return s3.putObject(objectParams).promise();
}
