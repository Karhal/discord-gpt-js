import config from '../config';

const duneApiKey = config.dune.apiKey || process.env.DUNE_API_KEY || '';

const fetchDuneData = async (queryId: string) => {
  const query = JSON.parse(queryId).queryId;
  const myHeaders = new Headers();
  myHeaders.append('X-Dune-API-Key', duneApiKey);
  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  try {
    const response = await fetch(
      `https://api.dune.com/api/v1/query/${query}/results?limit=1`,
      requestOptions
    );
    const result = await response.json();
    console.log(result);
    return result;
  }
  catch (error) {
    console.error(error);
  }
};

const fetchDuneDataTool = {
  type: 'function',
  function: {
    function: fetchDuneData,
    description:
      'use this tool only when asked to get data from Dune API. Read the result and provide the data to the user in a human readable format.',
    parameters: {
      type: 'object',
      properties: {
        queryId: { type: 'string' }
      }
    }
  }
};

export default fetchDuneDataTool;
