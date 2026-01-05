const supabase = require('../config/supabase');
const path = require('path');
require("dotenv").config()

module.exports = async function uploadReceipt(file, userId) {
  const fileExt = path.extname(file.originalname);
  const fileName = `${userId}/${Date.now()}${fileExt}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  return {
    filename: fileName,
    publicUrl: data.publicUrl
  };
};
