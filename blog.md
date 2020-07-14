# longtweet.io — a use case in on-demand static site generation

How do you make a highly scalable, highly performant blogging service for as little server cost as possible?

On-demand static site generation.

---

Recently on Twitter, [I've seen a lot of people use TwitLonger](https://twitter.com/search?q=tl.gd&src=typed_query). TwitLonger is a site separate from Twitter that lets users log in with their Twitter account and create longer, more traditional blog-style type of posts.

TwitLonger is a free-to-use service, however, it's littered with ads to pay for the server maintenance costs. TwitLonger is a self-funded project run by [one person](https://twitter.com/stuartgibson), so I mostly believe their claim that the ads are required to keep the site alive.

Oh also: TwitLonger is also [well over 10 years old](https://twitter.com/twitlonger/status/18896126622?s=20) (crazy)!

Given that, the question that comes in mind is: **Can we make a TwitLonger alternative that is ad-free in the year 2020?**

Short answer: yes! — via on-demand static site generation (SSG).

## The JAMstack

In case you've haven't been paying attention to recent trends in web development, many engineering teams have been adopting the "JAM stack" — short for javascript, APIs, and markup.

The name and the components of that "stack" aren't really important. In fact, I would say it's less of an actual stack and more of general architecture philosophy that exploits one thing:

How cheap and fast it is to serve static assets over a CDN.

With the JAMstack, you pre-render all your site's pages to static HTML during build time so that the resulting assets of your site are primarily static HTML pages. When content changes, the site is simply re-built.

The end result is extremely performant and scalable websites that cost near nothing to host.

## Taking the JAMstack further: On-demand SSG

For a user-generated blog site like TwitLonger, the JAMstack in this traditional sense won't work. There will be a point when re-building the whole site (even with an incremental approach) isn't feasible and another technique is needed.

So what do we do now?

Instead of re-rendering the whole site, we pre-render a single static HTML page on each new post. The resulting HTML page can then be saved in some storage bucket and served over CDN.

That's what on-demand SSG is — at the point in time where a user creates content, pre-render it.

If hooked up correctly, this approach does not require _any_ backend code in order for the page to be viewed and scales extremely well.

## The implementation — longtweet.io

You're looking at it.

You can login and [create a new post now](/compose).

When you create a new post, it calls an AWS lambda function. In that function is where this service takes your content, pre-renders it to a static HTML file, and saves it to an S3 bucket.

From there, S3 and CloudFront handle the rest. The site is set up to be hosted from this S3 bucket so after the file gets dropped in, it's live.

## Performance

It's excellent.

Viewing a post is highly optimized and virtually free. When any user from around the world views a page, it's readily available at network edges via CloudFront.

I maxed out what I could for free on [k6](https://k6.io) cloud and longtweet was able to handle sub 10 millisecond response times at 50 requests per second for 5 minutes — all while still on the free tier in AWS.

![Load test result](/load-test-result.png)

## Taking performance further with minimalism

For both performance and cost reasons, longtweet serves a very small bundle.

Longtweet posts are almost entirely static content with just a tiny bit of javascript used to show author controls.

The CSS and JS are inlined into the post's HTML making this beautiful network tab:

![longtweet network tab](/longtweet-network-tab.png)

In 6.4kB in one request, the whole site is loaded (and we could push this minimalism further if we wanted to).

The minimalism makes a big difference for performance.

![lighthouse scores. longtweet vs twitlonger](/lighthouse-vs.jpg)

Pictured left are the [lighthouse](https://developers.google.com/web/tools/lighthouse) scores for longtweet and on the right are the lighthouse scores for TwitLonger (with ads).

The rest of the pages on longtweet are client-side generated with [preact](https://preactjs.com/). The resulting bundle there is around 30kB.

## Drawbacks

So at this point, you might be asking the big question: how do you change anything?

Doing migrations of a site like this would require all of the users posts to be re-rendered. In order to make that possible, save the un-rendered content to some DB explicitly for a migration.

---

Longtweet is also open source. [Checkout the source code here.](https://github.com/ricokahler/longtweet.io)

Feel free to suggest ideas and contribute in any way. Transparency and simplicity are at the heart of this app. There are no plans on monetizing this.
