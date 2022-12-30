import { db } from '../db.js';

export const getPosts = (req, res) => {
  const postsQuery = {
    tag: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id in (select posts.post_id from posts join tag_post on tag_post.post_id = posts.post_id join tags on tag_post.tag_id = tags.tag_id where tags.content=?) group by posts.post_id ;`,
    cat: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.cat=? group by posts.post_id;`,
    default: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id group by posts.post_id;`,
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
          if (!tags[0].id) {
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
  const postMetaQuery = `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id = ?;`;
  const postId = req.params.id;
  db.query(postMetaQuery, [postId], (err, meta) => {
    if (err) return res.status(500).json(err);
    let tags = JSON.parse(meta[0].tags);
    if (!tags[0].id) {
      tags = null;
    }
    const postDetailQuery =
      'select post_content from posts_detail where post_id = ?';
    db.query(postDetailQuery, [postId], (err, content) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({
        postId: meta[0].post_id,
        userId: meta[0].user_id,
        author: meta[0].author,
        title: meta[0].post_title,
        desc: meta[0].post_desc,
        cat: meta[0].cat,
        views: meta[0].post_views,
        date: meta[0].post_date,
        modified: meta[0].post_modified,
        tags: tags,
        content: content[0].post_content,
      });
    });
  });
};

export const updatePost = (req, res) => {
  res.json('from controller');
};

export const deletePost = (req, res) => {
  res.json('from controller');
};
