const express = require("express");
const router = express.Router();

// Controllers
const {
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
} = require("../controllers/home/homeController");

// Middleware
const uploadHomeVideo = require("../middleware/uploadHomeVideo");
const { bannerUpload } = require("../middleware/bannerUpload");
const uploadAvatar = require("../middleware/categoryMiddleware");

// GET Routes
router.get("/about-us", getAboutUs);
router.get("/banners", getBanners);
router.get("/home-video", getHomeVideo);
router.get("/terms-and-conditions", getTermsAndConditions);
router.get("/privacy-policy", getPrivacyPolicy);

// PUT Routes (Updates)
router.put("/about-us", updateAboutUs);
router.put("/terms-and-conditions", updateTermsAndConditions);
router.put("/privacy-policy", updatePrivacyPolicy);
router.put("/home-video", uploadHomeVideo, updateHomeVideo);
router.put("/banner/:id", bannerUpload.single("banner"), updateBanner);

router.put("/about-us", updateAboutUs);

//------------------------new --------------------------------

router.post("/add", uploadAvatar, addCategory);
router.get("/all", getCategories);
router.delete("/delete/:id", deleteCategory);

module.exports = router;
