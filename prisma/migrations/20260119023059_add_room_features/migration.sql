-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];
