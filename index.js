// Get env variables
require('dotenv').config();

import fetch from 'node-fetch';
import composeQueryParamUrl from './src/composeQueryParamUrl';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

// Get some data
async function getData(pageToken = undefined) {
  const params = {
    playlistId: YOUTUBE_PLAYLIST_ID,
    key: YOUTUBE_API_KEY,
    maxResults: 50, // 50 is the max allowed by YouTube API: https://developers.google.com/youtube/v3/docs/playlistItems/list#maxResults
    part: 'snippet',
  };

  if (pageToken) {
    params.pageToken = pageToken;
  }

  const response = await fetch(
    composeQueryParamUrl('https://www.googleapis.com/youtube/v3/playlistItems', params)
  );

  return await response.json();
}

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

async function main() {
  const result = await getVideos();
  console.log(`Got ${result.length} videos.`);
}

main();
