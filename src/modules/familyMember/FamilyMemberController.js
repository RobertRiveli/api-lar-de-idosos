import FamilyMemberService from "./FamilyMemberService.js";

class FamilyMemberController {
  create = async (req, res, next) => {
    try {
      const familyMember = await FamilyMemberService.create(req.body);

      return res.status(201).json(familyMember);
    } catch (error) {
      next(error);
    }
  };
}

export default new FamilyMemberController();
