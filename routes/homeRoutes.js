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
  updateFeaturedTalent,
} = require("../controllers/home/homeController");

// Middleware
const uploadHomeVideo = require("../middleware/uploadHomeVideo");
const { bannerUpload } = require("../middleware/bannerUpload");
const uploadAvatar = require("../middleware/categoryMiddleware");
// const uploadFeaturedImg = require("../middleware/uploadFeaturedImg");
const uploadTestimonialImg = require("../middleware/testimonialImg");
const uploadFeaturedImages = require("../middleware/uploadFeaturedImg");

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

router.post("category", uploadAvatar, addCategory);
router.get("/category", getCategories);
router.delete("/category/:id", deleteCategory);

//------------------Work ----------------------------------

router.post("/featured", uploadFeaturedImages, addFeaturedTalent);
router.get("/featured", getFeaturedTalents);
router.delete("/featured/:id", deleteFeaturedTalent);
router.put("/featured/:id", uploadFeaturedImages, updateFeaturedTalent);

//------------------done -------------------------------------
router.post("/testimonials", uploadTestimonialImg, addTestimonial);
router.get("/testimonials", getTestimonials);
router.delete("/testimonials/:id", deleteTestimonial);
router.put("/testimonials/:id", uploadTestimonialImg, updateTestimonial);

//------------------done ----------------------------------------

router.get("/plan-detail", getPlandetail);
router.put("/plan-detail", updatePlandetail);

module.exports = router;
