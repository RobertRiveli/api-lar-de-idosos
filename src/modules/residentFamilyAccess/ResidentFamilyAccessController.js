import ResidentFamilyAccessService from "./ResidentFamilyAccessService.js";

class ResidentFamilyAccessController {
  listFamilyMembersByResident = async (req, res, next) => {
    try {
      const { residentId } = req.params;
      const { companyId, role } = req.user;

      const familyMembers =
        await ResidentFamilyAccessService.listFamilyMembersByResident(
          residentId,
          companyId,
          role,
        );

      return res.status(200).json(familyMembers);
    } catch (error) {
      next(error);
    }
  };

  listResidents = async (req, res, next) => {
    try {
      const { familyMemberId } = req.familyMember;

      const residents =
        await ResidentFamilyAccessService.listResidentsForFamilyMember(
          familyMemberId,
        );

      return res.status(200).json(residents);
    } catch (error) {
      next(error);
    }
  };

  getResidentDetails = async (req, res, next) => {
    try {
      const { familyMemberId } = req.familyMember;
      const { residentId } = req.params;

      const resident =
        await ResidentFamilyAccessService.getResidentDetailsForFamilyMember(
          familyMemberId,
          residentId,
        );

      return res.status(200).json(resident);
    } catch (error) {
      next(error);
    }
  };

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

  listCompanyFamilyAccesses = async (req, res, next) => {
    try {
      const { companyId, role } = req.user;

      const result =
        await ResidentFamilyAccessService.listCompanyFamilyAccesses(
          companyId,
          role,
        );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default new ResidentFamilyAccessController();
