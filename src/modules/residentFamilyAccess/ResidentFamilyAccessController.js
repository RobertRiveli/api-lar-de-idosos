import ResidentFamilyAccessService from "./ResidentFamilyAccessService.js";

class ResidentFamilyAccessController {
  redeemAccessCode = async (req, res, next) => {
    try {
      const { code, relationship } = req.body;
      const { familyMemberId } = req.familyMember;

      const residentFamilyAccess =
        await ResidentFamilyAccessService.redeemAccessCode({
          code,
          relationship,
          familyMemberId,
        });

      return res.status(201).json(residentFamilyAccess);
    } catch (error) {
      next(error);
    }
  };
}

export default new ResidentFamilyAccessController();
