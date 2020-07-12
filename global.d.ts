interface LambdaEvent {
  httpMethod: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS';
  headers: { [key: string]: string | undefined };
  body?: string;
}

interface LambdaResult {
  statusCode: number;
  body?: string;
  headers?: { [key: string]: string };
}

interface LambdaHandler {
  (event: LambdaEvent): Promise<LambdaResult>;
}
