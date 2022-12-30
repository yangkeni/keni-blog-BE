import { db } from '../db.js';

export const getPosts = (req, res) => {
  const postsQuery = {
    tag: `select posts.*, json_arrayagg(json_object("color", tags.color, "content", tags.content)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id in (select posts.post_id from posts join tag_post on tag_post.post_id = posts.post_id join tags on tag_post.tag_id = tags.tag_id where tags.content=?) group by posts.post_id ;`,
    cat: `select posts.*, json_arrayagg(json_object("color", tags.color, "content", tags.content)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.cat=? group by posts.post_id;`,
    default: `select posts.*, json_arrayagg(json_object("color", tags.color, "content", tags.content)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id group by posts.post_id;`,
  };
  const param = Object.keys(req.query);
  db.query(
    postsQuery[param.length > 0 ? param[0] : 'default'],
    [req.query[param[0]]],
    (err, data) => {
      if (err) return res.status(500).json(err);

      return res.status(200).json(
        data.map((val) => {
          let tags = JSON.parse(val.tags);
          if (!tags[0].color) {
            tags = null;
          }
          return {
            postId: val.post_id,
            userId: val.user_id,
            author: val.author,
            title: val.post_title,
            desc: val.post_desc,
            cat: val.cat,
            views: val.post_views,
            date: val.post_date,
            modified: val.post_modified,
            tags: tags,
          };
        })
      );
    }
  );
};

export const addPost = (req, res) => {
  res.json('from controller');
};

export const getPost = (req, res) => {
  res.json('from controller');
};

export const updatePost = (req, res) => {
  res.json('from controller');
};

export const deletePost = (req, res) => {
  res.json('from controller');
};
