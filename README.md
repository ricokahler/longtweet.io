# longtweet.io

stay tuned

architecture:

- preact app that allows a user to login via twitter
- one endpoint will be created to get all the posts associated with a user with create, read, and delete (no update). when create or delete is called, this will cause the long tweet HTML page to be compiled on demand and uploaded/delete from S3 as well as updating a database
- deploys will work using GitHub actions and one large script

endpoints:

- GET /posts — gets all the posts for the current users
- GET /posts/:postId — get a single post
- POST /posts — create a new post (also builds an HTML files and drops it into S3)
- DELETE /posts/:postId — deletes a post (also deletes from S3)

TODO (in order)

- [ ] twitter auth (to figure out what twitter uses as IDs)
- [ ] create database table
- [ ] create endpoint with DB writes
- [ ] create endpoint with S3 writes
- [ ] load test
- [ ] write frontend
- [ ] write HTML template (for creating static pages to be uploaded to S3)

deployments:

- script to upload functions to lambda
- script to upload static frontend to S3
- script to re-render all S3 pages using DB (should not be needed very often)

site monitoring: is the site still up? are the certificates still good?

sign in with twitter:

1. get access token from twitter
2. save tuple of twitter ID / access_token
3. send client our own JWT which includes the twitter ID
4. on each request, check if the JWT is valid and from us
5. put twitter ID in JWT, lookup access_token from twitter ID
6. ping twitter to see if user is still logged in
7. allow request


## sign in twitter flow:

1. get session ID from server
2. make request to sign in with twitter, post with sign in ID
3. 