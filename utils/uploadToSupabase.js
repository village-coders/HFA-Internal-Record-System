const supabase = require("../configs/supabase");
const { v4: uuidv4 } = require("uuid");

const uploadToSupabase = async (file, folder) => {

    const filePath = `${folder}/${Date.now()}-${uuidv4()}-${file.originalname.replace(/\s+/g, "_")}`;


  const { error } = await supabase.storage
    .from("hfa-files")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("hfa-files")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

module.exports = uploadToSupabase;
