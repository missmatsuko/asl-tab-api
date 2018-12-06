/*
  Given a base URL and an object of query parameters as key/value pairs,
  returns a composed query parameter URL
*/
const composeQueryParamUrl = function(baseUrl, queryParams) {
  const queryParamsArray = Object.entries(queryParams).map(([key, value]) => {
    return `${key}=${encodeURIComponent(value)}`;
  });
  return `${baseUrl}?${queryParamsArray.join('&')}`;
};

export default composeQueryParamUrl;
