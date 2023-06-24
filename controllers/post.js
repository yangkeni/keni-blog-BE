import { db } from '../db.js';
import { STATUSCODE } from "./statusCode.js";
import jwt from 'jsonwebtoken';

export const getPosts = async(req, res) => {
  const postsQuery = {
    tag: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id in (select posts.post_id from posts join tag_post on tag_post.post_id = posts.post_id join tags on tag_post.tag_id = tags.tag_id where tags.content=?) group by posts.post_id ;`,
    cat: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) tags from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.cat=? group by posts.post_id;`,
    default: `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id group by posts.post_id;`,
  };
  const param = Object.keys(req.query);
  try {
    const [ posts ] = await db.query(postsQuery[param.length > 0 ? param[0] : 'default'], [req.query[param[0]]]);
    const renamePosts = posts.map(val => {
      let tags = val.tags;
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
    return res.status(STATUSCODE.SUCCESS).json(renamePosts);
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'get posts error',
      error
    })
  }
};

export const addPost = async(req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(STATUSCODE.AUTH_ERROR).json('can not get token');
  try {
    const { id: userId } = await jwt.verify(token, process.env.JWT_KEY);
    const { title, desc, tags, cat, content, username } = req.body;
    const postInsertQuery =
      'insert into posts(user_id, author, cat, post_title, post_desc) values(?)';
    const [ postRes ] = await db.query(
      postInsertQuery,
      [[userId, username, cat, title, desc]],
    );
    const { insertId: postId } = postRes;
    const postDetailInsertQuery =
      'insert into posts_detail(post_id, post_content) values(?)';
    const [ postDetailRes ] = await db.query(postDetailInsertQuery, [[postId, content]]);
    const insertTagPostQuery =
      'insert into tag_post(tag_id, post_id) values(?)';
    let tagsRes = '';
    if(tags) {
      tagsRes = tags.map( async(tag) => {
        const [ tagRes ] = await db.query(insertTagPostQuery, [[tag, postId]]);
        return tagRes;
      });
    }
    return res.status(STATUSCODE.SUCCESS).json({
      postRes,
      postDetailRes,
      tagsRes
    });
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'add post error',
      error
    });
  }
};

export const getPost = async(req, res) => {
  const postMetaQuery = `select posts.*, json_arrayagg(json_object("id", tags.tag_id, "color", tags.color, "content", tags.content, "value", tags.color)) 'tags' from posts left join tag_post on posts.post_id = tag_post.post_id left join tags on tag_post.tag_id = tags.tag_id where posts.post_id = ?;`;
  const postId = req.params.id;
  try {
    const [ postMeta ] = await db.query(postMetaQuery, [postId]);
    let tags = postMeta[0].tags;
    if (!tags || !tags[0].id) {
      tags = [{ id: 4, color: 'cyan', value: 'cyan', content: '杂谈' }];
    }
    const postDetailQuery =
      'select post_content from posts_detail where post_id = ?';
    const [ postDetail ] = await db.query(postDetailQuery, [postId]);
    return res.status(STATUSCODE.SUCCESS).json({
      postId: postMeta[0].post_id,
      userId: postMeta[0].user_id,
      author: postMeta[0].author,
      title: postMeta[0].post_title,
      desc: postMeta[0].post_desc,
      cat: postMeta[0].cat,
      views: postMeta[0].post_views,
      date: postMeta[0].post_date,
      modified: postMeta[0].post_modified,
      tags: tags,
      content: postDetail[0]?.post_content,
    });
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'get post error',
      error
    });
  }
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
    const [ postUpdateRes ] = await db.query(postUpdateQuery, [title, desc, cat, postId, userId]);
    const [ postDetailUpdateRes ] = await db.query(postDetailUpdateQuery, [content, postId]);
    const [ deleteTagPostRes ] = await db.query(deleteTagPostQuery, [postId]);
    let tagsRes = '';
    if(tags) {
      tagsRes = tags.map(async (tag) => {
        const [ tagRes ] = await db.query(insertTagPostQuery, [[tag, postId]]);
        return tagRes;
      });
    }
    return res.status(STATUSCODE.SUCCESS).json({
      postUpdateRes,
      postDetailUpdateRes,
      deleteTagPostRes,
      tagsRes
    });
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'update post error',
      error
    });
  }
};

export const deletePost = async (req, res) => {
  const postId = req.params.id;
  if (!postId) return res.status(STATUSCODE.DELETE_ERROR).json('can not get post id');
  const token = req.cookies.access_token;
  if (!token) return res.status(STATUSCODE.AUTH_ERROR).json('can not get token');
  try {
    const { id: userId } = await jwt.verify(token, process.env.JWT_KEY);
    const postDeleteQuery =
      'delete from posts where post_id = ? and user_id = ?';
    const postDetailDeleteQuery = 'delete from posts_detail where post_id = ?';
    const tagPostDeleteQuery = 'delete from tag_post where post_id = ?';
    const [ postDeleteRes ] = await db.query(postDeleteQuery, [postId, userId]);
    const [ postDetailDeleteRes ] = await db.query(postDetailDeleteQuery, [postId]);
    const [ tagPostDeleteRes ] = await db.query(tagPostDeleteQuery, [postId]);
    return res.status(STATUSCODE.SUCCESS).json({
      postDeleteRes,
      postDetailDeleteRes,
      tagPostDeleteRes
    });
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'delete post error',
      error
    });
  }
};
