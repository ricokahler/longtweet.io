function wrappedFetch(url: string, options?: RequestInit) {
  return fetch(`${process.env.ORIGIN}${url}`, options);
}

export default wrappedFetch;
