/*
* index.js
* This file is the main js file. It gets all the video data from a YouTube channel specified in .env and uploads it to Amazon S3 as a JSON file.
*/

// Import modules
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { parse, toSeconds } from 'iso8601-duration';
import composeQueryParamUrl from './src/composeQueryParamUrl';

// Get env variables
try {
  require('dotenv').config();
} catch (error) {
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

// Fetch playlist items data from YouTube
async function getPlaylistItemsData(pageToken = undefined) {
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

/*
* Fetch videos data from YouTube
*
* NOTE: Number of video IDs passed to videos API must be less than 50 according to several SO posts:
* - https://stackoverflow.com/questions/36370821/does-youtube-v3-data-api-have-a-limit-to-the-number-of-ids-you-can-send-to-vide
* - https://stackoverflow.com/questions/24860601/youtube-v3-api-id-query-parameter-length
*/
async function getVideosData(ids) {
  const params = {
    playlistId: YOUTUBE_PLAYLIST_ID, // max. 50 ids
    key: YOUTUBE_API_KEY,
    id: ids,
    part: 'contentDetails',
  };

  const response = await fetch(
    composeQueryParamUrl('https://www.googleapis.com/youtube/v3/videos', params)
  );

  return await response.json();
}

// Create array of video info
async function getResult() {
  const result = {};
  let pageToken = undefined;

  while (true) {
    const playlistItemsData = await getPlaylistItemsData(pageToken);

    if (playlistItemsData.items.length) {
      /*
      * Only keep required data:
      * - video ID
      * - video title
      * - video duration (seconds)
      */

      // Get video's title and ID from playlist items data
      for (const playlistItem of playlistItemsData.items) {
        const snippet = playlistItem.snippet;
        const videoId = snippet.resourceId.videoId;
        result[videoId] = {
          id: videoId,
          title: snippet.title,
        }
      }

      // Get video duration from videos API (this is not available from playlist items API)
      const playlistItemsIds = playlistItemsData.items.map((playlistItem) => playlistItem.snippet.resourceId.videoId).join(',');

      const videosData = await getVideosData(playlistItemsIds);

      if (videosData.items.length) {
        for (const video of videosData.items) {
          result[video.id].duration = toSeconds(parse(video.contentDetails.duration));
        }
      }
    }

    if (playlistItemsData.nextPageToken) {
      pageToken = playlistItemsData.nextPageToken;
    } else {
      break;
    }
  }

  return Object.values(result);
}

// Upload result as JSON file to Amazon S3
export default async function uploadToS3() {
  const result = await getResult();

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
