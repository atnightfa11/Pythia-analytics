export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      environment: {
        NETLIFY: process.env.NETLIFY,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY_DEV: process.env.NETLIFY_DEV,
        NETLIFY_URL: process.env.NETLIFY_URL,
        // Computed values
        isNetlify: process.env.NETLIFY === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME,
        isDev: process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV === 'true',
        shouldCallPython: (process.env.NETLIFY === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME) && 
                         !(process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV === 'true')
      }
    })
  }
} 