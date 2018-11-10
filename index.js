// Get env variables
require('dotenv').config();

import fetch from 'node-fetch';
import composeQueryParamUrl from './src/composeQueryParamUrl';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

// Get some data
async function getData() {
  let data;

  try {
    const response = await fetch(
      composeQueryParamUrl(
        'https://www.googleapis.com/youtube/v3/playlists',
        {
          'key': YOUTUBE_API_KEY,
          'id': YOUTUBE_PLAYLIST_ID,
          'part': 'contentDetails',
        }
      )
    );

    data = await response.json();
  } catch (error) {
    console.error('Error:', error);
    return;
  }

  console.log(data);
}

getData();
