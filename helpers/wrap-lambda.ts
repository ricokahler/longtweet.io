const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Origin': 'https://longtweet.io',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

function wrapLambda(handler: LambdaHandler): LambdaHandler {
  return async (event) => {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: corsHeaders,
      };
    }

    try {
      const result = await handler(event);

      return {
        ...result,
        headers: {
          ...corsHeaders,
          ...result.headers,
        },
      };
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        headers: corsHeaders,
      };
    }
  };
}

export default wrapLambda;
