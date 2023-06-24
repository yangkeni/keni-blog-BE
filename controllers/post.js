import { db } from '../db.js';
import jwt from 'jsonwebtoken';

export const getPosts = (req, res) => {
  const postsQuery = {
    tag: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id in (select posts.post_id from posts join tag_post on tag_post.post_id = posts.post_id join tags on tag_post.tag_id = tags.tag_id where tags.content=?) group by posts.post_id ;`,
    cat: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.cat=? group by posts.post_id;`,
    default: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id group by posts.post_id;`,
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
            tags = [{ id: 4, color: 'cyan', value: 'cyan', content: '杂谈' }];
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

export const addPost = async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json('can not get token');
  try {
    const { id: userId } = await jwt.verify(token, process.env.JWT_KEY);
    // await db.query('select username from users where id = ?', [userId]);
    const { title, desc, tags, cat, content, username } = req.body;
    const postInsertQuery =
      'insert into posts(user_id, author, cat, post_title, post_desc) values(?)';
    db.query(
      postInsertQuery,
      [[userId, username, cat, title, desc]],
      (err, data) => {
        if (err) throw err;
        const { insertId: postId } = data;
        const postDetailInsertQuery =
          'insert into posts_detail(post_id, post_content) values(?)';
        db.query(postDetailInsertQuery, [[postId, content]], (err, data) => {
          if (err) throw err;
          return res.status(200).json('success');
        });
      }
    );
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getPost = (req, res) => {
  const postMetaQuery = `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id = ?;`;
  const postId = req.params.id;
  db.query(postMetaQuery, [postId], (err, meta) => {
    if (err) return res.status(500).json(err);
    let tags = JSON.parse(meta[0].tags);
    if (!tags || !tags[0].id) {
      tags = [{ id: 4, color: 'cyan', value: 'cyan', content: '杂谈' }];
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
        content: content[0]?.post_content,
      });
    });
  });
};

export const updatePost = async (req, res) => {
  const postId = req.params.id;
  if (!postId) return res.status(401).json('can not get post id');
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json('can not get token');
  try {
    const { id: userId } = await jwt.verify(token, process.env.JWT_KEY);
    const postUpdateQuery =
      'update posts set post_title=?, post_desc=?, cat=?, post_modified=CURRENT_TIMESTAMP where post_id=? and user_id=?';
    const postDetailUpdateQuery =
      'update posts_detail set post_content=? where post_id=?';
    const deleteTagPostQuery = 'delete from tag_post where post_id=?';
    const insertTagPostQuery =
      'insert into tag_post(tag_id, post_id) values(?)';
    const { title, desc, cat, tags, content } = req.body;
    await db.query(postUpdateQuery, [title, desc, cat, postId, userId]);
    await db.query(postDetailUpdateQuery, [content, postId]);
    await db.query(deleteTagPostQuery, [postId]);
    tags &&
      tags.map(async (tag) => {
        await db.query(insertTagPostQuery, [[tag, postId]]);
      });
    return res.status(200).json('update success');
  } catch (error) {
    return res.status(500);
  }
};

export const deletePost = async (req, res) => {
  const postId = req.params.id;
  if (!postId) return res.status(401).json('can not get post id');
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json('can not get token');
  try {
    const { id: userId } = jwt.verify(token, process.env.JWT_KEY);
    const postDeleteQuery =
      'delete from posts where post_id = ? and user_id = ?';
    const postDetailDeleteQuery = 'delete from posts_detail where post_id = ?';
    const deleteTagPostQuery = 'delete from tag_post where post_id = ?';
    await db.query(postDeleteQuery, [postId, userId]);
    await db.query(postDetailDeleteQuery, [postId]);
    await db.query(deleteTagPostQuery, [postId]);
    return res.status(200).json('update success');
  } catch (error) {
    return res.status(500);
  }
};
