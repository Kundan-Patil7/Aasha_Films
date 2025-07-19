/**
 * Home Page Content Management Controller
 * Handles operations for home video, banners, about us, terms, and privacy policy
 */

const express = require("express");
const pool = require("../../config/database");
const path = require("path");
const fs = require("fs");

// Helper function to remove file if it exists
function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    }
  }
}

const uploadDir = path.join(process.cwd(), "uploads", "HomeVideo");
const bannerDir = path.join(process.cwd(), "uploads", "banners");

// Home Video Operations
const getHomeVideo = async (req, res) => {
  try {
    const [[videoRow] = []] = await pool.query(
      `SELECT video_path, updated_at AS updatedAt FROM homeVideo WHERE id = ?`,
      [1]
    );

    if (!videoRow?.video_path) {
      return res.status(404).json({
        success: false,
        message: "No home video found",
      });
    }

    const videoUrl = `${req.protocol}://${req.get("host")}/uploads/HomeVideo/${
      videoRow.video_path
    }`;

    res.status(200).json({
      success: true,
      message: "Home video fetched successfully 🎥",
      video: {
        filename: videoRow.video_path,
        url: videoUrl,
        updatedAt: videoRow.updatedAt,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching home video:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch home video",
      error: err.message,
    });
  }
};

async function initHomeVideoTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS homeVideo (
      id          INT PRIMARY KEY AUTO_INCREMENT,
      video_path  VARCHAR(255) DEFAULT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query("SELECT id FROM homeVideo WHERE id = 1");
  if (rows.length === 0) {
    await pool.query("INSERT INTO homeVideo (id, video_path) VALUES (1, NULL)");
  }
}

const updateHomeVideo = async (req, res) => {
  let tempFilePath = req.file ? req.file.path : null;
  const videoId = parseInt(req.params.id, 10) || 1;

  try {
    await initHomeVideoTable();

    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded." });
    }

    const [[record] = []] = await pool.query(
      "SELECT video_path FROM homeVideo WHERE id = ?",
      [videoId]
    );

    if (!record) {
      return res.status(404).json({ error: `Row id ${videoId} not found.` });
    }

    if (record.video_path) {
      const oldPath = path.isAbsolute(record.video_path)
        ? record.video_path
        : path.join(uploadDir, record.video_path);
      if (oldPath !== tempFilePath) removeIfExists(oldPath);
    }

    const newFilename = req.file.filename;
    await pool.query("UPDATE homeVideo SET video_path = ? WHERE id = ?", [
      newFilename,
      videoId,
    ]);

    tempFilePath = null;
    return res.json({
      message: `Video for id ${videoId} updated successfully 🎉`,
      file: newFilename,
    });
  } catch (err) {
    console.error("updateHomeVideo error →", err);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log("Temp file removed ➜", tempFilePath);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file ➜", unlinkErr);
      }
    }
    return res
      .status(500)
      .json({ error: "Server error. Upload rolled back, file deleted." });
  }
};

// Banner Operations
const getBanners = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, image_path, updated_at AS updatedAt FROM banners ORDER BY id ASC`
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No banners found",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/banners/`;
    const banners = rows.map((b) => ({
      id: b.id,
      filename: b.image_path,
      url: `${baseUrl}${b.image_path}`,
      updatedAt: b.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: "Banners fetched successfully 🖼️",
      banners,
    });
  } catch (err) {
    console.error("❌ getBanners error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
      error: err.message,
    });
  }
};

async function initBannerTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      image_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query("SELECT id FROM banners");
  const existingIds = rows.map((r) => r.id);

  if (!existingIds.includes(1)) {
    await pool.query("INSERT INTO banners (id, image_path) VALUES (1, NULL)");
  }
  if (!existingIds.includes(2)) {
    await pool.query("INSERT INTO banners (id, image_path) VALUES (2, NULL)");
  }
}

const updateBanner = async (req, res) => {
  let tempFilePath = req.file ? req.file.path : null;
  const bannerId = parseInt(req.params.id, 10) || 1;

  try {
    await initBannerTable();

    if (!req.file) {
      return res.status(400).json({ error: "No banner uploaded." });
    }

    const [[record] = []] = await pool.query(
      "SELECT image_path FROM banners WHERE id = ?",
      [bannerId]
    );
    if (!record) {
      return res.status(404).json({ error: `Banner ${bannerId} not found.` });
    }

    if (record.image_path) {
      const oldPath = path.join(bannerDir, record.image_path);
      if (oldPath !== tempFilePath) removeIfExists(oldPath);
    }

    const newFilename = req.file.filename;
    await pool.query("UPDATE banners SET image_path = ? WHERE id = ?", [
      newFilename,
      bannerId,
    ]);

    tempFilePath = null;
    return res.json({
      message: `Banner ${bannerId} updated successfully 🎉`,
      file: newFilename,
    });
  } catch (err) {
    console.error("Error updating banner:", err);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    return res.status(500).json({ error: "Server error. Upload failed." });
  }
};

// About Us Operations
const getAboutUs = async (req, res) => {
  try {
    const [[row] = []] = await pool.query(
      "SELECT html_content, updated_at FROM about_us WHERE id = 1"
    );

    if (!row?.html_content) {
      return res.status(404).json({
        success: false,
        message: "No About Us content found",
      });
    }

    res.status(200).json({
      success: true,
      message: "About Us content fetched successfully 🙌",
      aboutUs: {
        html: row.html_content,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching About Us:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch About Us content",
      error: err.message,
    });
  }
};

const initAboutUsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS about_us (
      id INT PRIMARY KEY AUTO_INCREMENT,
      html_content LONGTEXT DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query("SELECT id FROM about_us WHERE id = 1");
  if (rows.length === 0) {
    await pool.query(
      "INSERT INTO about_us (id, html_content) VALUES (1, NULL)"
    );
  }
};

const updateAboutUs = async (req, res) => {
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res.status(400).json({
      success: false,
      message: "No HTML content provided",
    });
  }

  try {
    await initAboutUsTable();
    await pool.query("UPDATE about_us SET html_content = ? WHERE id = 1", [
      htmlContent,
    ]);

    res.status(200).json({
      success: true,
      message: "About Us content updated successfully ✅",
    });
  } catch (err) {
    console.error("❌ Error updating About Us:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update About Us",
      error: err.message,
    });
  }
};

// Terms and Conditions Operations
const initializeTermsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS terms_and_conditions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        html_content LONGTEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [result] = await pool.query(
      `SELECT COUNT(*) AS count FROM terms_and_conditions`
    );
    if (result[0].count === 0) {
      await pool.query(`
        INSERT INTO terms_and_conditions (html_content) VALUES ('<p>Default Terms and Conditions Content</p>')
      `);
      console.log("Default terms and conditions content inserted");
    }
  } catch (error) {
    console.error("Error initializing terms table:", error);
    throw error;
  }
};

const getTermsAndConditions = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT * FROM terms_and_conditions ORDER BY id DESC LIMIT 1"
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No terms and conditions found",
      });
    }

    res.status(200).json({
      success: true,
      content: result[0].html_content,
      lastUpdated: result[0].last_updated,
    });
  } catch (error) {
    console.error("Error fetching terms and conditions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch terms and conditions",
      error: error.message,
    });
  }
};

const updateTermsAndConditions = async (req, res) => {
  try {
    await initializeTermsTable();
    const { html_content } = req.body;

    if (!html_content) {
      return res.status(400).json({
        success: false,
        message: "Invalid content",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM terms_and_conditions LIMIT 1"
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No terms found to update",
      });
    }

    await pool.query(
      "UPDATE terms_and_conditions SET html_content = ? WHERE id = ?",
      [html_content, existing[0].id]
    );

    res.status(200).json({
      success: true,
      message: "Terms and conditions updated successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update terms",
      error: error.message,
    });
  }
};

// Privacy Policy Operations
const initializePrivacyTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS privacy_policy (
        id INT AUTO_INCREMENT PRIMARY KEY,
        html_content LONGTEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [result] = await pool.query(
      `SELECT COUNT(*) AS count FROM privacy_policy`
    );
    if (result[0].count === 0) {
      await pool.query(`
        INSERT INTO privacy_policy (html_content) VALUES ('<p>Default Privacy Policy Content</p>')
      `);
      console.log("Default privacy policy content inserted");
    }
  } catch (error) {
    console.error("Error initializing privacy table:", error);
    throw error;
  }
};

const getPrivacyPolicy = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT * FROM privacy_policy ORDER BY id DESC LIMIT 1"
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No privacy policy found",
      });
    }

    res.status(200).json({
      success: true,
      content: result[0].html_content,
      lastUpdated: result[0].last_updated,
    });
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch privacy policy",
      error: error.message,
    });
  }
};

const updatePrivacyPolicy = async (req, res) => {
  try {
    await initializePrivacyTable();
    const { html_content } = req.body;

    if (!html_content) {
      return res.status(400).json({
        success: false,
        message: "Invalid content",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM privacy_policy LIMIT 1"
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No privacy policy found to update",
      });
    }

    await pool.query(
      "UPDATE privacy_policy SET html_content = ? WHERE id = ?",
      [html_content, existing[0].id]
    );

    res.status(200).json({
      success: true,
      message: "Privacy policy updated successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update privacy policy",
      error: error.message,
    });
  }
};

const addCategory = async (req, res) => {
  const { title, talent_count, description, gender } = req.body;
  const avatar = req.file ? req.file.filename : null;

  if (!avatar || !title || !gender) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    // Check if table exists
    const [tableCheck] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'popular_categories'
    `);

    if (tableCheck[0].count === 0) {
      // If not exists, create it
      await pool.query(`
        CREATE TABLE popular_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          avatar VARCHAR(255) NOT NULL,
          title VARCHAR(100) NOT NULL,
          talent_count INT DEFAULT 0,
          description TEXT,
          gender ENUM('Male','Male-Female' ,'Female', 'Boy', 'Girl','Boy-Girl') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Insert the data
    const insertQuery = `
      INSERT INTO popular_categories (avatar, title, talent_count, description, gender)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(insertQuery, [
      avatar,
      title,
      talent_count || 0,
      description,
      gender,
    ]);

    const categoryUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/categoryImg/${avatar}`;

    res.status(201).json({
      message: "Category added successfully",
      category: {
        title,
        talent_count: talent_count || 0,
        description,
        gender,
        avatarUrl: categoryUrl,
      },
    });
  } catch (err) {
    console.error("Add Category Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const [data] = await pool.query(
      "SELECT * FROM popular_categories ORDER BY id DESC"
    );

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/categoryImg/`;
    const categoriesWithUrls = data.map((category) => ({
      ...category,
      avatarUrl: `${baseUrl}${category.avatar}`,
    }));

    res.status(200).json(categoriesWithUrls);
  } catch (err) {
    console.error("Fetch Categories Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { title, talent_count, description, gender } = req.body;
  const avatar = req.file ? req.file.filename : null;

  if (!title || !gender) {
    return res.status(400).json({ message: "Title and gender are required" });
  }

  try {
    // 1. Check if category exists
    const [existingCategory] = await pool.query(
      "SELECT avatar FROM popular_categories WHERE id = ?",
      [id]
    );

    if (existingCategory.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Prepare update data
    let updateFields = {
      title,
      talent_count: talent_count || 0,
      description: description || null,
      gender
    };

    let updateQuery = "UPDATE popular_categories SET title = ?, talent_count = ?, description = ?, gender = ?";
    const queryParams = [title, talent_count || 0, description, gender];

    // 3. Handle avatar update if new file was uploaded
    if (avatar) {
      updateQuery += ", avatar = ?";
      queryParams.push(avatar);

      // Delete old avatar file
      const oldAvatar = existingCategory[0].avatar;
      const oldAvatarPath = path.join(
        __dirname,
        "../../uploads/categoryImg",
        oldAvatar
      );

      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(id);

    // 4. Execute update
    await pool.query(updateQuery, queryParams);

    // 5. Prepare response
    const responseData = {
      id,
      title,
      talent_count: talent_count || 0,
      description,
      gender
    };

    if (avatar) {
      responseData.avatarUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/categoryImg/${avatar}`;
    } else {
      responseData.avatarUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/categoryImg/${existingCategory[0].avatar}`;
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: responseData,
    });
  } catch (err) {
    console.error("Update Category Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch the avatar file name
    const [rows] = await pool.query(
      "SELECT avatar FROM popular_categories WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const avatarFilename = rows[0].avatar;
    const avatarPath = path.join(
      __dirname,
      "../../uploads/categoryImg",
      avatarFilename
    );

    // 2. Delete the image from file system
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // 3. Delete the record from DB
    await pool.query("DELETE FROM popular_categories WHERE id = ?", [id]);

    res
      .status(200)
      .json({ message: "Category and image deleted successfully" });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const addFeaturedTalent = async (req, res) => {
  const {
    name,
    gender,
    age,
    location,
    height,
    hair_color,
    shoe_size,
    eye_color,
  } = req.body;

  // Handle multiple image uploads
  const profile_img = req.files?.profile_img?.[0]?.filename || null;
  const image1 = req.files?.image1?.[0]?.filename || null;
  const image2 = req.files?.image2?.[0]?.filename || null;
  const image3 = req.files?.image3?.[0]?.filename || null;

  if (!name || !gender || !profile_img) {
    return res
      .status(400)
      .json({ message: "Name, gender and profile image are required" });
  }

  try {
    // Check and create tables if needed
    const [talentTable] = await pool.query(`
      SELECT COUNT(*) AS count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'featured_talents'
    `);

    if (talentTable[0].count === 0) {
      await pool.query(`
        CREATE TABLE featured_talents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          gender ENUM('Male', 'Female', 'Boy', 'Girl') NOT NULL,
          age INT,
          location VARCHAR(100),
          height VARCHAR(50),
          hair_color VARCHAR(50),
          shoe_size VARCHAR(50),
          eye_color VARCHAR(50),
          profile_img VARCHAR(255) NOT NULL,
          image1 VARCHAR(255),
          image2 VARCHAR(255),
          image3 VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    const [reactTable] = await pool.query(`
      SELECT COUNT(*) AS count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'react'
    `);

    if (reactTable[0].count === 0) {
      await pool.query(`
        CREATE TABLE react (
          id INT AUTO_INCREMENT PRIMARY KEY,
          info TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Insert new talent
    const insertQuery = `
      INSERT INTO featured_talents 
      (name, gender, age, location, height, hair_color, shoe_size, eye_color, profile_img, image1, image2, image3)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(insertQuery, [
      name,
      gender,
      age,
      location,
      height,
      hair_color,
      shoe_size,
      eye_color,
      profile_img,
      image1,
      image2,
      image3,
    ]);

    // Prepare response with image URLs
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/featuredImg/`;
    const responseData = {
      name,
      gender,
      age,
      location,
      height,
      hair_color,
      shoe_size,
      eye_color,
      profileUrl: `${baseUrl}${profile_img}`,
      image1Url: image1 ? `${baseUrl}${image1}` : null,
      image2Url: image2 ? `${baseUrl}${image2}` : null,
      image3Url: image3 ? `${baseUrl}${image3}` : null,
    };

    // Log to react table
    await pool.query("INSERT INTO react (info) VALUES (?)", [
      `Added featured talent: ${name}`,
    ]);

    res.status(201).json({
      message: "Featured talent added successfully",
      talent: responseData,
    });
  } catch (err) {
    console.error("Add Talent Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getFeaturedTalents = async (req, res) => {
  try {
    const [data] = await pool.query(
      "SELECT * FROM featured_talents ORDER BY created_at DESC"
    );

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/featuredImg/`;
    const talentsWithUrls = data.map((talent) => ({
      ...talent,
      profileUrl: `${baseUrl}${talent.profile_img}`,
      image1Url: talent.image1 ? `${baseUrl}${talent.image1}` : null,
      image2Url: talent.image2 ? `${baseUrl}${talent.image2}` : null,
      image3Url: talent.image3 ? `${baseUrl}${talent.image3}` : null,
    }));

    res.status(200).json(talentsWithUrls);
  } catch (err) {
    console.error("Fetch Talents Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateFeaturedTalent = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    age,
    location,
    height,
    hair_color,
    shoe_size,
    eye_color,
  } = req.body;

  // Handle multiple image uploads
  const profile_img = req.files?.profile_img?.[0]?.filename || null;
  const image1 = req.files?.image1?.[0]?.filename || null;
  const image2 = req.files?.image2?.[0]?.filename || null;
  const image3 = req.files?.image3?.[0]?.filename || null;

  if (!name || !gender) {
    return res.status(400).json({ message: "Name and gender are required" });
  }

  try {
    // Get existing talent data
    const [existingTalent] = await pool.query(
      "SELECT profile_img, image1, image2, image3 FROM featured_talents WHERE id = ?",
      [id]
    );

    if (existingTalent.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    // Prepare update data
    const updateFields = {
      name,
      gender,
      age: age || null,
      location: location || null,
      height: height || null,
      hair_color: hair_color || null,
      shoe_size: shoe_size || null,
      eye_color: eye_color || null,
    };

    // Handle image updates and deletions
    const imagesFolder = path.join(__dirname, "../../uploads/featuredImg/");
    const oldImages = existingTalent[0];

    const updateImage = (fieldName, newFilename) => {
      if (newFilename) {
        updateFields[fieldName] = newFilename;
        // Delete old image if it exists
        if (oldImages[fieldName]) {
          const oldPath = path.join(imagesFolder, oldImages[fieldName]);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }
    };

    updateImage("profile_img", profile_img);
    updateImage("image1", image1);
    updateImage("image2", image2);
    updateImage("image3", image3);

    // Build and execute update query
    const updateQuery = `
      UPDATE featured_talents SET
        name = ?,
        gender = ?,
        age = ?,
        location = ?,
        height = ?,
        hair_color = ?,
        shoe_size = ?,
        eye_color = ?,
        profile_img = ?,
        image1 = ?,
        image2 = ?,
        image3 = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      updateFields.name,
      updateFields.gender,
      updateFields.age,
      updateFields.location,
      updateFields.height,
      updateFields.hair_color,
      updateFields.shoe_size,
      updateFields.eye_color,
      updateFields.profile_img || oldImages.profile_img,
      updateFields.image1 || oldImages.image1,
      updateFields.image2 || oldImages.image2,
      updateFields.image3 || oldImages.image3,
      id,
    ]);

    // Prepare response
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/featuredImg/`;
    const responseData = {
      id,
      ...updateFields,
      profileUrl: `${baseUrl}${
        updateFields.profile_img || oldImages.profile_img
      }`,
      image1Url: updateFields.image1
        ? `${baseUrl}${updateFields.image1}`
        : oldImages.image1
        ? `${baseUrl}${oldImages.image1}`
        : null,
      image2Url: updateFields.image2
        ? `${baseUrl}${updateFields.image2}`
        : oldImages.image2
        ? `${baseUrl}${oldImages.image2}`
        : null,
      image3Url: updateFields.image3
        ? `${baseUrl}${updateFields.image3}`
        : oldImages.image3
        ? `${baseUrl}${oldImages.image3}`
        : null,
    };

    // Log update
    await pool.query("INSERT INTO react (info) VALUES (?)", [
      `Updated featured talent: ${name} (ID: ${id})`,
    ]);

    res.status(200).json({
      message: "Talent updated successfully",
      talent: responseData,
    });
  } catch (err) {
    console.error("Update Talent Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteFeaturedTalent = async (req, res) => {
  const { id } = req.params;

  try {
    // Get talent data including all images
    const [talent] = await pool.query(
      "SELECT name, profile_img, image1, image2, image3 FROM featured_talents WHERE id = ?",
      [id]
    );

    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const talentName = talent[0].name;
    const imagesFolder = path.join(__dirname, "../../uploads/featuredImg/");

    // Delete all associated images
    const deleteImage = (filename) => {
      if (filename) {
        const filePath = path.join(imagesFolder, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    };

    deleteImage(talent[0].profile_img);
    deleteImage(talent[0].image1);
    deleteImage(talent[0].image2);
    deleteImage(talent[0].image3);

    // Delete talent record
    await pool.query("DELETE FROM featured_talents WHERE id = ?", [id]);

    // Clean up any orphaned images in the folder
    const [usedImages] = await pool.query(
      "SELECT profile_img, image1, image2, image3 FROM featured_talents"
    );
    const usedFilenames = [];
    usedImages.forEach((item) => {
      if (item.profile_img) usedFilenames.push(item.profile_img);
      if (item.image1) usedFilenames.push(item.image1);
      if (item.image2) usedFilenames.push(item.image2);
      if (item.image3) usedFilenames.push(item.image3);
    });

    fs.readdirSync(imagesFolder).forEach((file) => {
      if (!usedFilenames.includes(file)) {
        const filePath = path.join(imagesFolder, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted orphan image: ${file}`);
      }
    });

    // Log deletion
    await pool.query("INSERT INTO react (info) VALUES (?)", [
      `Deleted featured talent: ${talentName} (ID: ${id})`,
    ]);

    res
      .status(200)
      .json({ message: "Talent and all images deleted successfully" });
  } catch (err) {
    console.error("Delete Talent Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const addTestimonial = async (req, res) => {
  const { name, description, them } = req.body;
  const avatar = req.file ? req.file.filename : null;

  if (!name || !description || !avatar) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    // 1. Check if table 'testimonials' exists
    const [tableCheck] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'testimonials'
    `);

    // 2. Create if not exists
    if (tableCheck[0].count === 0) {
      await pool.query(`
        CREATE TABLE testimonials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          avatar VARCHAR(255) NOT NULL,
          them TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 3. Insert testimonial
    const insertQuery = `
      INSERT INTO testimonials (name, description, avatar, them)
      VALUES (?, ?, ?, ?)
    `;
    await pool.query(insertQuery, [name, description, avatar, them || 1]);

    const testimonialUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/testimonialsImg/${avatar}`;

    res.status(201).json({
      message: "Testimonial added successfully",
      testimonial: {
        name,
        description,
        them: them || 1,
        avatarUrl: testimonialUrl,
      },
    });
  } catch (err) {
    console.error("Add Testimonial Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getTestimonials = async (req, res) => {
  try {
    const [data] = await pool.query(
      "SELECT * FROM testimonials ORDER BY id DESC"
    );

    const baseUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/testimonialsImg/`;
    const testimonialsWithUrls = data.map((testimonial) => ({
      ...testimonial,
      avatarUrl: `${baseUrl}${testimonial.avatar}`,
    }));

    res.status(200).json(testimonialsWithUrls);
  } catch (err) {
    console.error("Fetch Testimonials Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteTestimonial = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get the avatar filename
    const [rows] = await pool.query(
      "SELECT avatar FROM testimonials WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    const avatar = rows[0].avatar;
    const folderPath = path.join(__dirname, "../../uploads/testimonialsImg/");
    const avatarPath = path.join(folderPath, avatar);

    // 2. Delete record from DB
    await pool.query("DELETE FROM testimonials WHERE id = ?", [id]);

    // 3. Delete image file
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // 4. Clean orphaned images
    const [usedAvatars] = await pool.query("SELECT avatar FROM testimonials");
    const usedFilenames = usedAvatars.map((row) => row.avatar);

    fs.readdirSync(folderPath).forEach((file) => {
      if (!usedFilenames.includes(file)) {
        const filePath = path.join(folderPath, file);
        fs.unlinkSync(filePath);
        console.log("Deleted orphan image:", file);
      }
    });

    res
      .status(200)
      .json({ message: "Testimonial and image deleted successfully" });
  } catch (err) {
    console.error("Delete Testimonial Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
const updateTestimonial = async (req, res) => {
  const { id } = req.params;
  const { name, description, them } = req.body;
  const avatar = req.file ? req.file.filename : null;

  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Name and description are required" });
  }

  try {
    // 1. Check if testimonial exists
    const [existingTestimonial] = await pool.query(
      "SELECT avatar FROM testimonials WHERE id = ?",
      [id]
    );

    if (existingTestimonial.length === 0) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    // 2. Prepare update data
    let updateFields = {
      name,
      description,
      them: them || 1,
    };

    let updateQuery =
      "UPDATE testimonials SET name = ?, description = ?, them = ?";
    const queryParams = [name, description, them || 1];

    // 3. Handle avatar update if new file was uploaded
    if (avatar) {
      updateQuery += ", avatar = ?";
      queryParams.push(avatar);

      // Delete old avatar file
      const oldAvatar = existingTestimonial[0].avatar;
      const oldAvatarPath = path.join(
        __dirname,
        "../../uploads/testimonialsImg/",
        oldAvatar
      );

      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(id);

    // 4. Execute update
    await pool.query(updateQuery, queryParams);

    // 5. Prepare response
    const responseData = {
      id,
      name,
      description,
      them: them || 1,
    };

    if (avatar) {
      responseData.avatarUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/testimonialsImg/${avatar}`;
    } else {
      responseData.avatarUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/testimonialsImg/${existingTestimonial[0].avatar}`;
    }

    res.status(200).json({
      message: "Testimonial updated successfully",
      testimonial: responseData,
    });
  } catch (err) {
    console.error("Update Testimonial Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const initializePlandetailTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plan_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        heading VARCHAR(255),
        description LONGTEXT,
        plan_benefits LONGTEXT,
        from_whom VARCHAR(255),
        why_subscribe LONGTEXT,
        price INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.query("SELECT id FROM plan_details WHERE id = 1");
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO plan_details (id, heading, description, plan_benefits, from_whom, why_subscribe, price) 
         VALUES (1, NULL, NULL, NULL, NULL, NULL, 0)`
      );
      console.log("Default plan_details row inserted.");
    }
  } catch (error) {
    console.error("Error initializing plan_details table:", error);
    throw error;
  }
};

const getPlandetail = async (req, res) => {
  try {
    await initializePlandetailTable();
    const [[planDetail] = []] = await pool.query(
      "SELECT heading, description, plan_benefits, from_whom, why_subscribe, price, updated_at FROM plan_details WHERE id = 1"
    );

    if (!planDetail) {
      return res.status(404).json({
        success: false,
        message: "No plan details found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan details fetched successfully",
      planDetail: planDetail,
    });
  } catch (err) {
    console.error("Fetch Plandetail Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePlandetail = async (req, res) => {
  const {
    heading,
    description,
    plan_benefits,
    from_whom,
    why_subscribe,
    price,
  } = req.body;

  if (
    !heading ||
    !description ||
    !plan_benefits ||
    !from_whom ||
    !why_subscribe ||
    price === undefined
  ) {
    return res.status(400).json({
      message:
        "All fields (heading, description, plan_benefits, from_whom, why_subscribe, price) are required for update.",
    });
  }

  // Validate price is an integer
  if (!Number.isInteger(price)) {
    return res.status(400).json({
      message: "Price must be an integer value",
    });
  }

  try {
    await initializePlandetailTable();

    const updateQuery = `
      UPDATE plan_details
      SET heading = ?, description = ?, plan_benefits = ?, from_whom = ?, why_subscribe = ?, price = ?
      WHERE id = 1
    `;
    await pool.query(updateQuery, [
      heading,
      description,
      plan_benefits,
      from_whom,
      why_subscribe,
      price,
    ]);

    res.status(200).json({ message: "Plan details updated successfully" });
  } catch (err) {
    console.error("Update Plandetail Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getHomeVideo,
  getBanners,
  getAboutUs,
  updateHomeVideo,
  getTermsAndConditions,
  getPrivacyPolicy,
  updateTermsAndConditions,
  updatePrivacyPolicy,
  updateBanner,
  updateAboutUs,
  addCategory,
  getCategories,
  deleteCategory,
  deleteFeaturedTalent,
  getFeaturedTalents,
  addFeaturedTalent,
  addTestimonial,
  getTestimonials,
  deleteTestimonial,
  getPlandetail,
  updatePlandetail,
  updateTestimonial,
  updateFeaturedTalent,
  updateCategory,
};
