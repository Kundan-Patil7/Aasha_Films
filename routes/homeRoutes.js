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
  addFeaturedTalent,
  getFeaturedTalents,
  deleteFeaturedTalent,
  addTestimonial,
  getTestimonials,
  deleteTestimonial,
  getPlandetail,
  updatePlandetail,
  updateTestimonial,
} = require("../controllers/home/homeController");

// Middleware
const uploadHomeVideo = require("../middleware/uploadHomeVideo");
const { bannerUpload } = require("../middleware/bannerUpload");
const uploadAvatar = require("../middleware/categoryMiddleware");
const uploadFeaturedImg = require("../middleware/uploadFeaturedImg");
const uploadTestimonialImg = require("../middleware/testimonialImg");

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

//-------------------work --------------------------------

router.post("/add-category", uploadAvatar, addCategory);
router.get("/all-category", getCategories);
router.delete("/delete-category/:id", deleteCategory);

//------------------Work ----------------------------------

router.post("/add-featured", uploadFeaturedImg, addFeaturedTalent);
router.get("/all-featured", getFeaturedTalents);
router.delete("/delete-featured/:id", deleteFeaturedTalent);

//------------------work -------------------------------------
router.post("/testimonials", uploadTestimonialImg, addTestimonial);
router.get("/testimonials", getTestimonials);
router.delete("/testimonials/:id", deleteTestimonial);
router.put("/testimonials/:id", uploadTestimonialImg, updateTestimonial);

//------------------new----------------------------------------

router.get("/plan-detail", getPlandetail);
router.put("/plan-detail", updatePlandetail);

module.exports = router;
