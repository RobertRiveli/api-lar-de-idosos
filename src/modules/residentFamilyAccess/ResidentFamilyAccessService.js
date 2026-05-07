import { prisma } from "../../database/prisma.js";
import AppError from "../../errors/AppError.js";
import ResidentAccessCodeRepository from "../residents/residentAccessCode/ResidentAccessCodeRepository.js";
import ResidentFamilyAccessRepository from "./ResidentFamilyAccessRepository.js";

class ResidentFamilyAccessService {
  async redeemAccessCode({ code, relationship, familyMemberId }) {
    const accessCode = await ResidentAccessCodeRepository.findByCode(code);

    this.validateAccessCode(accessCode);

    const existingAccess =
      await ResidentFamilyAccessRepository.findByResidentAndFamilyMember(
        accessCode.residentId,
        familyMemberId,
      );

    if (existingAccess) {
      throw new AppError(
        "Familiar já possui acesso a este residente",
        409,
        "RESIDENT_FAMILY_ACCESS_CONFLICT",
      );
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const codeInsideTransaction =
          await ResidentAccessCodeRepository.findByCode(code, tx);

        this.validateAccessCode(codeInsideTransaction);

        const existingAccessInsideTransaction =
          await ResidentFamilyAccessRepository.findByResidentAndFamilyMember(
            codeInsideTransaction.residentId,
            familyMemberId,
            tx,
          );

        if (existingAccessInsideTransaction) {
          throw new AppError(
            "Familiar já possui acesso a este residente",
            409,
            "RESIDENT_FAMILY_ACCESS_CONFLICT",
          );
        }

        const residentFamilyAccess =
          await ResidentFamilyAccessRepository.create(
            {
              residentId: codeInsideTransaction.residentId,
              familyMemberId,
              relationship,
            },
            tx,
          );

        const updatedAccessCode =
          await ResidentAccessCodeRepository.incrementUses(
            codeInsideTransaction.id,
            tx,
          );

        if (updatedAccessCode.usesCount >= updatedAccessCode.maxUses) {
          await ResidentAccessCodeRepository.deactivate(
            updatedAccessCode.id,
            tx,
          );
        }

        return residentFamilyAccess;
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new AppError(
          "Familiar já possui acesso a este residente",
          409,
          "RESIDENT_FAMILY_ACCESS_CONFLICT",
        );
      }

      throw error;
    }
  }

  validateAccessCode(accessCode) {
    if (!accessCode) {
      throw new AppError(
        "Código de acesso inválido",
        400,
        "INVALID_ACCESS_CODE",
      );
    }

    if (!accessCode.isActive) {
      throw new AppError(
        "Código de acesso inativo",
        400,
        "INACTIVE_ACCESS_CODE",
      );
    }

    if (accessCode.expiresAt <= new Date()) {
      throw new AppError(
        "Código de acesso expirado",
        400,
        "EXPIRED_ACCESS_CODE",
      );
    }

    if (accessCode.usesCount >= accessCode.maxUses) {
      throw new AppError(
        "Código de acesso já utilizado",
        400,
        "USED_ACCESS_CODE",
      );
    }
  }
}

export default new ResidentFamilyAccessService();
