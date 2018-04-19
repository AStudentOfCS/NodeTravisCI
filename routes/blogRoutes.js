const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const clearCache = require('../middlewares/clearCache');

const Blog = mongoose.model('Blog');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    // Restoring Blogs route handler for resolving PROBLEM
    const blogs = await Blog.find({ _user: req.user.id }).cache({
      key: req.user.id
    });

    res.send(blogs);

    /*
    // Apply Cache Server layer to store database with Redis in default action
    const redis = require('redis');
    const redisUrl = 'redis://127.0.0.1:6379';
    const client = redis.createClient(redisUrl);
    const util = require('util');
    // instead of using callback in redis - get(key, callback) function
    // using 'promisify' to make redis get func become 'promise'
    client.get = util.promisify(client.get);

    // Do we have any cached data in redis related to this query
    const cachedBlogs = await client.get(req.user.id);

    // if YES, then respond to the request right away and return
    if (cachedBlogs) {
      console.log('SERVING FROM CACHE');
      return res.send(JSON.parse(cachedBlogs));
    }

    // if NO, we need to respond to request and update our cache to store the data
    const blogs = await Blog.find({ _user: req.user.id });

    console.log('SERVING FROM MONGODB');
    res.send(blogs);

    client.set(req.user.id, JSON.stringify(blogs));
    */

    /*
              PROBLEM with this default action way:
              -1- Caching code isn't easily reusable anywhere else in our codebase
                  ==> Solution:
                                Hook in to Mongoose's query generation and execution process.
                                  --> modify or override Query.prototype functions in Mongoose

              -2- Cached values never expire
                  ==> Solution:
                                Add timeout to values assigned to redis.
                                Also add ability to reset all values tied to some specific events.

              -3- Cache keys won't work when we introduce other collections or query options
                  ==> Solution:
                                Figure out a more robust solution for generating cache keys.
                                Using query.getOptions() + including collections name
                                  --> list all query options as a object
                                  --> change this object to string
                                  --> use this string for cache keys
      */
  });

  app.post('/api/blogs', requireLogin, clearCache, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
