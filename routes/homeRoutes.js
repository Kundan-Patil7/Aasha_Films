const express = require("express");
const router = express.Router();

// Controllers
const {
  // Home Page Content
  getHomeVideo,
  updateHomeVideo,
  getBanners,
  updateBanner,
  getAboutUs,
  updateAboutUs,

  // Legal Pages
  getTermsAndConditions,
  updateTermsAndConditions,
  getPrivacyPolicy,
  updatePrivacyPolicy,

  // Categories
  addCategory,
  getCategories,
  deleteCategory,
  updateCategory,

  // Featured Talents
  addFeaturedTalent,
  getFeaturedTalents,
  deleteFeaturedTalent,
  updateFeaturedTalent,

  // Testimonials
  addTestimonial,
  getTestimonials,
  deleteTestimonial,
  updateTestimonial,

  // Plan Details
  getPlandetail,
  updatePlandetail,
} = require("../controllers/home/homeController");

// Middleware
const uploadHomeVideo = require("../middleware/uploadHomeVideo");
const { bannerUpload } = require("../middleware/bannerUpload");
const uploadAvatar = require("../middleware/categoryMiddleware");
const uploadTestimonialImg = require("../middleware/testimonialImg");
const uploadFeaturedImages = require("../middleware/uploadFeaturedImg");

// ------------------- Home Page Content Routes -------------------
router.get("/home-video", getHomeVideo);
router.put("/home-video", uploadHomeVideo, updateHomeVideo);

router.get("/banners", getBanners);
router.put("/banners/:id", bannerUpload.single("banner"), updateBanner);

router.get("/about-us", getAboutUs);
router.put("/about-us", updateAboutUs);

// ------------------- Legal Pages Routes -------------------------
router.get("/terms-and-conditions", getTermsAndConditions);
router.put("/terms-and-conditions", updateTermsAndConditions);

router.get("/privacy-policy", getPrivacyPolicy);
router.put("/privacy-policy", updatePrivacyPolicy);

// ------------------- Category Routes ---------------------------
router.post("/categories", uploadAvatar, addCategory);
router.get("/categories", getCategories);
router.delete("/categories/:id", deleteCategory);
router.put("/categories/:id", uploadAvatar, updateCategory);

// ------------------- Featured Talent Routes --------------------
router.post("/featured-talents", uploadFeaturedImages, addFeaturedTalent);
router.get("/featured-talents", getFeaturedTalents);
router.delete("/featured-talents/:id", deleteFeaturedTalent);
router.put("/featured-talents/:id", uploadFeaturedImages, updateFeaturedTalent);

// ------------------- Testimonial Routes ------------------------
router.post("/testimonials", uploadTestimonialImg, addTestimonial);
router.get("/testimonials", getTestimonials);
router.delete("/testimonials/:id", deleteTestimonial);
router.put("/testimonials/:id", uploadTestimonialImg, updateTestimonial);

// ------------------- Plan Detail Routes ------------------------
router.get("/plan-details", getPlandetail);
router.put("/plan-details", updatePlandetail);

module.exports = router;
