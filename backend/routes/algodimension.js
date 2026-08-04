const { Router } = require("express");
const { 
  createdimension, 
  createOpportunityVector,
  evaluateApplicantMatchController 
} = require("../controllers/algodimension");

const router = Router();

router.post("/createdimensions", createdimension);
router.post("/process-opportunity-vector", createOpportunityVector);
router.post("/process-opportunity-vector/:id", createOpportunityVector);

// Route to evaluate match score between an applicant (user) and an opportunity
router.post("/evaluate-applicant-match", evaluateApplicantMatchController);
router.post("/evaluate-applicant-match/:userId/:opportunityId", evaluateApplicantMatchController);

module.exports = router;