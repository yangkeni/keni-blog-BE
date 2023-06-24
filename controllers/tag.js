import { db } from '../db.js';
import { STATUSCODE } from "./statusCode.js";

export const getTags = async(req, res) => {
  const tagsQuery = 'select * from tags';
  try {
    const [ tags ] = await db.query(tagsQuery);
    const renameTags = tags.map((val) => {
      return {
        id: val.tag_id,
        label: val.content,
        color: val.color,
        value: val.color,
      };
    })
    return res.status(STATUSCODE.SUCCESS).json(renameTags);
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'get tags error',
      error
    });
  }
};
