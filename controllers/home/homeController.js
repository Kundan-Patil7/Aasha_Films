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
  const profile_img = req.file ? req.file.filename : null;

  if (!name || !gender || !profile_img) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    // 1. Check if featured_talents table exists
    const [talentTable] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'featured_talents'
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
          profile_img VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 2. Check if react table exists
    const [reactTable] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'react'
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

    // 3. Insert featured talent
    const insertQuery = `
      INSERT INTO featured_talents 
      (name, gender, age, location, height, hair_color, shoe_size, eye_color, profile_img)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ]);

    const talentUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/featuredImg/${profile_img}`;

    // Optional: Add entry to react log
    await pool.query("INSERT INTO react (info) VALUES (?)", [
      `Added featured talent: ${name}`,
    ]);

    res.status(201).json({
      message: "Featured talent added successfully",
      talent: {
        name,
        gender,
        age,
        location,
        height,
        hair_color,
        shoe_size,
        eye_color,
        profileUrl: talentUrl,
      },
    });
  } catch (err) {
    console.error("Add Talent Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getFeaturedTalents = async (req, res) => {
  try {
    const [data] = await pool.query(
      "SELECT * FROM featured_talents ORDER BY id DESC"
    );

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/featuredImg/`;
    const talentsWithUrls = data.map((talent) => ({
      ...talent,
      profileUrl: `${baseUrl}${talent.profile_img}`,
    }));

    res.status(200).json(talentsWithUrls);
  } catch (err) {
    console.error("Fetch Talents Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteFeaturedTalent = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT profile_img FROM featured_talents WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const profileImg = rows[0].profile_img;
    const folderPath = path.join(__dirname, "../../uploads/featuredImg/");
    const fullImgPath = path.join(folderPath, profileImg);

    // 1. Delete talent from DB
    await pool.query("DELETE FROM featured_talents WHERE id = ?", [id]);

    // 2. Delete image file
    if (fs.existsSync(fullImgPath)) {
      fs.unlinkSync(fullImgPath);
    }

    // 3. Clean orphaned images in folder
    const [usedImages] = await pool.query(
      "SELECT profile_img FROM featured_talents"
    );
    const usedFilenames = usedImages.map((item) => item.profile_img);

    fs.readdirSync(folderPath).forEach((file) => {
      if (!usedFilenames.includes(file)) {
        const filePath = path.join(folderPath, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted orphan image: ${file}`);
      }
    });

    // Optional: log in react table
    await pool.query("INSERT INTO react (info) VALUES (?)", [
      `Deleted featured talent ID: ${id}`,
    ]);

    res.status(200).json({ message: "Talent and image deleted successfully" });
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
};
